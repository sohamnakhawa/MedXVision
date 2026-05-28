"""Train binary and multi-label DenseNet121 models for NIH ChestXray14."""
from argparse import ArgumentParser
from pathlib import Path

import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split

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
    "Pleural_Thickening",
    "Hernia",
]

DATA_DIR = Path("../../dataset")
CSV_PATH = DATA_DIR / "sample_labels.csv"
IMAGE_DIR = DATA_DIR / "images"
OUT_DIR = Path("../../backend/app/model_store")
IMG_SIZE = (224, 224)
AUTOTUNE = tf.data.AUTOTUNE


def build_densenet(output_units: int):
    base = tf.keras.applications.DenseNet121(
        include_top=False, input_shape=(224, 224, 3), weights="imagenet"
    )
    base.trainable = False
    x = tf.keras.layers.GlobalAveragePooling2D()(base.output)
    x = tf.keras.layers.Dropout(0.3)(x)
    out = tf.keras.layers.Dense(output_units, activation="sigmoid")(x)
    return tf.keras.Model(base.input, out)


def load_dataframe() -> pd.DataFrame:
    df = pd.read_csv(CSV_PATH)
    df["image_path"] = df["Image Index"].apply(lambda x: str((IMAGE_DIR / x).resolve()))
    df = df[df["image_path"].apply(lambda p: Path(p).exists())].copy()
    df["is_abnormal"] = (df["Finding Labels"] != "No Finding").astype("float32")
    for disease in DISEASES:
        df[disease] = df["Finding Labels"].apply(
            lambda labels: float(disease in labels.split("|"))
        )
    return df


def decode_image(path, label):
    img = tf.io.read_file(path)
    img = tf.image.decode_png(img, channels=3)
    img = tf.image.resize(img, IMG_SIZE)
    img = tf.cast(img, tf.float32) / 255.0
    return img, label


def augment_image(img, label):
    img = tf.image.random_flip_left_right(img)
    img = tf.image.random_brightness(img, 0.08)
    img = tf.image.random_contrast(img, 0.9, 1.1)
    return img, label


def make_dataset(paths, labels, batch_size: int, training: bool):
    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    if training:
        ds = ds.shuffle(min(len(paths), 5000), reshuffle_each_iteration=True)
    ds = ds.map(decode_image, num_parallel_calls=AUTOTUNE)
    if training:
        ds = ds.map(augment_image, num_parallel_calls=AUTOTUNE)
    ds = ds.batch(batch_size).prefetch(AUTOTUNE)
    return ds


def train_binary(train_df, val_df, epochs: int, batch_size: int):
    train_ds = make_dataset(
        train_df["image_path"].values,
        train_df["is_abnormal"].values,
        batch_size,
        training=True,
    )
    val_ds = make_dataset(
        val_df["image_path"].values,
        val_df["is_abnormal"].values,
        batch_size,
        training=False,
    )
    model = build_densenet(1)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-4),
        loss="binary_crossentropy",
        metrics=["accuracy", tf.keras.metrics.AUC(name="auc")],
    )
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_auc", mode="max", patience=4, restore_best_weights=True
        ),
        tf.keras.callbacks.ModelCheckpoint(
            str(OUT_DIR / "binary_densenet121.keras"),
            monitor="val_auc",
            mode="max",
            save_best_only=True,
        ),
    ]
    model.fit(train_ds, validation_data=val_ds, epochs=epochs, callbacks=callbacks)


def train_multilabel(train_df, val_df, epochs: int, batch_size: int):
    train_ds = make_dataset(
        train_df["image_path"].values,
        train_df[DISEASES].values.astype("float32"),
        batch_size,
        training=True,
    )
    val_ds = make_dataset(
        val_df["image_path"].values,
        val_df[DISEASES].values.astype("float32"),
        batch_size,
        training=False,
    )
    model = build_densenet(len(DISEASES))
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-4),
        loss="binary_crossentropy",
        metrics=[
            tf.keras.metrics.BinaryAccuracy(name="bin_acc"),
            tf.keras.metrics.Precision(name="precision"),
            tf.keras.metrics.Recall(name="recall"),
        ],
    )
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_bin_acc", mode="max", patience=4, restore_best_weights=True
        ),
        tf.keras.callbacks.ModelCheckpoint(
            str(OUT_DIR / "multilabel_densenet121.keras"),
            monitor="val_bin_acc",
            mode="max",
            save_best_only=True,
        ),
    ]
    model.fit(train_ds, validation_data=val_ds, epochs=epochs, callbacks=callbacks)


def main():
    parser = ArgumentParser()
    parser.add_argument("--epochs", type=int, default=6)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument(
        "--mode",
        choices=["binary", "multilabel", "both"],
        default="both",
        help="Choose which model(s) to train.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only validate dataset + pipeline, do not train.",
    )
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    df = load_dataframe()
    train_df, val_df = train_test_split(
        df, test_size=0.2, random_state=42, stratify=df["is_abnormal"]
    )
    print(f"Total usable images: {len(df)}")
    print(f"Train: {len(train_df)}, Validation: {len(val_df)}")
    print(f"Abnormal ratio: {df['is_abnormal'].mean():.3f}")

    if args.dry_run:
        sample_ds = make_dataset(
            train_df["image_path"].values[:16],
            train_df["is_abnormal"].values[:16],
            batch_size=8,
            training=True,
        )
        sample_batch = next(iter(sample_ds))
        print(
            "Dry run OK. Batch image shape:",
            sample_batch[0].shape,
            "Batch label shape:",
            sample_batch[1].shape,
        )
        return

    if args.mode in {"binary", "both"}:
        train_binary(train_df, val_df, args.epochs, args.batch_size)
    if args.mode in {"multilabel", "both"}:
        train_multilabel(train_df, val_df, args.epochs, args.batch_size)


if __name__ == "__main__":
    main()
