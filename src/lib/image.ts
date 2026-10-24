import { createHash } from "node:crypto";
import sharp from "sharp";
import { DomainError } from "@/lib/errors";

export const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 800;
export const STORED_IMAGE_MIME_TYPE = "image/webp";

const ALLOWED_INPUT_FORMATS = new Set(["jpeg", "png", "webp"]);

export type CompressedImage = {
  data: Buffer;
  mimeType: typeof STORED_IMAGE_MIME_TYPE;
  width: number;
  height: number;
  sizeBytes: number;
  checksum: string;
};

export async function compressImage(input: Buffer): Promise<CompressedImage> {
  if (input.length === 0) {
    throw new DomainError(400, "The uploaded image is empty.");
  }
  if (input.length > MAX_IMAGE_UPLOAD_BYTES) {
    throw new DomainError(413, "Image is too large. Maximum upload size is 8 MB.");
  }

  let inputFormat: string | undefined;
  try {
    const metadata = await sharp(input, {
      failOn: "error",
      limitInputPixels: 40_000_000,
    }).metadata();
    inputFormat = metadata.format;
  } catch {
    throw new DomainError(400, "The uploaded file is not a valid image.");
  }

  if (!inputFormat || !ALLOWED_INPUT_FORMATS.has(inputFormat)) {
    throw new DomainError(415, "Only JPEG, PNG, and WebP images are supported.");
  }

  try {
    const { data, info } = await sharp(input, {
      failOn: "error",
      limitInputPixels: 40_000_000,
    })
      .rotate()
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    if (!info.width || !info.height || info.width < 1 || info.height < 1) {
      throw new DomainError(400, "The uploaded image has invalid dimensions.");
    }

    return {
      data,
      mimeType: STORED_IMAGE_MIME_TYPE,
      width: info.width,
      height: info.height,
      sizeBytes: data.length,
      checksum: createHash("sha256").update(data).digest("hex"),
    };
  } catch (error) {
    if (error instanceof DomainError) throw error;
    throw new DomainError(400, "The image could not be processed.");
  }
}
