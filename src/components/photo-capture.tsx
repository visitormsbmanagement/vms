"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Upload, RotateCcw, Check, User } from "lucide-react";

interface PhotoCaptureProps {
  onPhotoCapture: (file: File) => void;
  currentPhoto: string | null;
}

export function PhotoCapture({
  onPhotoCapture,
  currentPhoto,
}: PhotoCaptureProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 480, height: 480 },
      });
      setStream(mediaStream);
      setCameraOpen(true);
      setCapturedImage(null);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch {
      alert(
        "Unable to access camera. Please check permissions or use the upload option."
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const handleCloseCamera = useCallback(() => {
    stopCamera();
    setCameraOpen(false);
    setCapturedImage(null);
  }, [stopCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const usePhoto = useCallback(() => {
    if (!capturedImage) return;
    fetch(capturedImage)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], "visitor-photo.jpg", {
          type: "image/jpeg",
        });
        onPhotoCapture(file);
        setCameraOpen(false);
        setCapturedImage(null);
      });
  }, [capturedImage, onPhotoCapture]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onPhotoCapture(file);
      }
    },
    [onPhotoCapture]
  );

  return (
    <>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-4">
          <div
            className={cn(
              "flex h-48 w-48 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-muted/50",
              currentPhoto && "border-solid border-primary/30"
            )}
          >
            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt="Visitor photo"
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-16 w-16 text-muted-foreground/40" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {currentPhoto
              ? "Photo captured successfully"
              : "Please take or upload a photo"}
          </p>
          <div className="flex w-full gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 gap-2 text-sm"
              onClick={startCamera}
            >
              <Camera className="h-4 w-4" />
              Take Photo
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 gap-2 text-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Upload Photo
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </CardContent>
      </Card>

      <Dialog open={cameraOpen} onOpenChange={(open) => !open && handleCloseCamera()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Take Photo</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-xl bg-black">
              {!capturedImage ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex w-full gap-3">
              {!capturedImage ? (
                <Button
                  type="button"
                  className="h-12 flex-1 gap-2"
                  onClick={capturePhoto}
                >
                  <Camera className="h-4 w-4" />
                  Capture
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-1 gap-2"
                    onClick={retakePhoto}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Retake
                  </Button>
                  <Button
                    type="button"
                    className="h-12 flex-1 gap-2"
                    onClick={usePhoto}
                  >
                    <Check className="h-4 w-4" />
                    Use Photo
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
