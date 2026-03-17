import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import api from "@/lib/api";

export type UploadSource = "camera" | "files";

interface UploadResult {
  doc_id: string;
  storage_url: string;
}

export function useDocumentUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (
    doc_type: string,
    source: UploadSource,
    application_id?: string,
  ): Promise<UploadResult | null> => {
    setError(null);
    setUploading(true);

    try {
      let fileUri: string;
      let fileName: string;
      let mimeType: string;

      if (source === "camera") {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: false,
        });
        if (result.canceled || !result.assets[0]) return null;
        const asset = result.assets[0];
        fileUri = asset.uri;
        fileName = `camera_${Date.now()}.jpg`;
        mimeType = "image/jpeg";
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["application/pdf", "image/*"],
          copyToCacheDirectory: true,
        });
        if (result.canceled || !result.assets[0]) return null;
        const asset = result.assets[0];
        fileUri = asset.uri;
        fileName = asset.name ?? `document_${Date.now()}`;
        mimeType = asset.mimeType ?? "application/octet-stream";
      }

      // Step 1: get presigned PUT URL from backend
      const { data: presignData } = await api.post("/documents/upload-url", {
        filename: fileName,
        content_type: mimeType,
        doc_type,
        application_id,
      });

      // Step 2: PUT file directly to R2
      const fileData = await fetch(fileUri);
      const blob = await fileData.blob();
      await axios.put(presignData.upload_url, blob, {
        headers: { "Content-Type": mimeType },
      });

      return {
        doc_id: presignData.doc_id,
        storage_url: presignData.storage_url,
      };
    } catch (err: any) {
      setError(err?.message ?? "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
}
