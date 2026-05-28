from flask import Flask, request, jsonify
from flask_cors import CORS

import tensorflow as tf
import numpy as np
from PIL import Image
import cv2
import os
from tensorflow.keras.models import Model

app = Flask(__name__)
CORS(app)

# -----------------------------
# LOAD MODELS
# -----------------------------

binary_model = tf.keras.models.load_model(
    "app/model_store/binary_densenet121.keras"
)

multilabel_model = tf.keras.models.load_model(
    "app/model_store/multilabel_densenet121.keras"
)

# -----------------------------
# DISEASE LABELS
# -----------------------------

DISEASES = [
    "Atelectasis",
    "Cardiomegaly",
    "Effusion",
    "Infiltration",
    "Mass",
    "Nodule",
    "Pneumonia",
    "Pneumothorax",
    "Consolidation",
    "Edema",
    "Emphysema",
    "Fibrosis",
    "Pleural Thickening",
    "Hernia",
]

# -----------------------------
# GRAD CAM CONFIG
# -----------------------------

LAST_CONV_LAYER = "conv5_block16_concat"

os.makedirs("static", exist_ok=True)


# -----------------------------
# GENERATE GRAD CAM
# -----------------------------

def generate_gradcam(image_array, model, pred_index=None):

    grad_model = Model(
        [model.inputs],
        [model.get_layer(LAST_CONV_LAYER).output, model.output]
    )

    with tf.GradientTape() as tape:

        conv_outputs, predictions = grad_model(image_array)

        if pred_index is None:
            pred_index = tf.argmax(predictions[0])

        class_channel = predictions[:, pred_index]

    grads = tape.gradient(class_channel, conv_outputs)

    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    conv_outputs = conv_outputs[0]

    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]

    heatmap = tf.squeeze(heatmap)

    heatmap = tf.maximum(heatmap, 0) / tf.math.reduce_max(heatmap)

    return heatmap.numpy()

# -----------------------------
# IMAGE PREPROCESSING
# -----------------------------

def preprocess_image(image):

    image = image.resize((224, 224))

    image = np.array(image)

    image = image / 255.0

    image = np.expand_dims(image, axis=0)

    return image


# -----------------------------
# HOME ROUTE
# -----------------------------

@app.route("/")
def home():

    return {
        "message": "MedXVision AI Backend Running"
    }


# -----------------------------
# PREDICTION ROUTE
# -----------------------------

@app.route("/predict", methods=["POST"])
def predict():

    if "image" not in request.files:
        return jsonify({
            "error": "No image uploaded"
        }), 400

    file = request.files["image"]

    image = Image.open(file).convert("RGB")
    original_image = image.copy()

    processed_image = preprocess_image(image)

    # -----------------------------
    # BINARY PREDICTION
    # -----------------------------

    binary_pred = binary_model.predict(processed_image)[0][0]

    # -----------------------------
    # NORMAL CASE
    # -----------------------------

    if binary_pred < 0.5:

        confidence = float((1 - binary_pred) * 100)

        return jsonify({
            "status": "Normal",
            "disease": "No Finding",
            "confidence": round(confidence, 2)
        })

    # -----------------------------
    # ABNORMAL CASE
    # -----------------------------

    multi_preds = multilabel_model.predict(processed_image)[0]

    predictions = []

    for i, prob in enumerate(multi_preds):

        confidence = float(prob * 100)

        if confidence > 15:

            predictions.append({
                "disease": DISEASES[i],
                "confidence": round(confidence, 2)
            })

    predictions = sorted(
        predictions,
        key=lambda x: x["confidence"],
        reverse=True
    )

    disease_index = np.argmax(multi_preds)

    disease_name = DISEASES[disease_index]

    confidence = float(multi_preds[disease_index] * 100)

    # -----------------------------
    # GENERATE GRAD CAM
    # -----------------------------

    heatmap = generate_gradcam(
        processed_image,
        multilabel_model,
        disease_index
    )

    original = np.array(original_image.resize((224, 224)))

    heatmap = cv2.resize(heatmap, (224, 224))

    heatmap = np.uint8(255 * heatmap)

    heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

    superimposed = heatmap * 0.4 + original

    gradcam_path = "static/gradcam.jpg"

    cv2.imwrite(gradcam_path, superimposed)

    return jsonify({
        "status": "Abnormal",
        "top_disease": disease_name,
        "top_confidence": round(confidence, 2),
        "predictions": predictions,
        "gradcam": "http://127.0.0.1:5002/static/gradcam.jpg"
    })


# -----------------------------
# RUN APP
# -----------------------------

if __name__ == "__main__":

    app.run(
        debug=True,
        port=5002
    )