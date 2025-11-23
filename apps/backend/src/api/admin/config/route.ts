import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * Endpoint to expose public configuration values to the admin UI
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  res.json({
    minio_file_url: process.env.MINIO_FILE_URL,
    minio_bucket: process.env.MINIO_BUCKET,
  })
}
