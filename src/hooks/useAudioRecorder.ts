import { useCallback, useRef, useState } from "react";

export type AudioRecorderState = {
  recordingBlob: Blob | null;
  isRecording: boolean;
  error: string | null;
};

export function useAudioRecorder() {
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Empty deps: we only read refs and call setState. Refs are stable; setState from useState
  // is stable. So [] keeps callback identity stable for consumers (e.g. memoized children).
  const startRecording = useCallback(async () => {
    setError(null);
    setRecordingBlob(null);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        if (chunksRef.current.length > 0) {
          setRecordingBlob(new Blob(chunksRef.current, { type: mimeType }));
        }
      };
      recorder.start(200);
      setIsRecording(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Microphone access failed";
      setError(message);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      setIsRecording(false);
    }
  }, []);

  const clearRecording = useCallback(() => {
    setRecordingBlob(null);
    setError(null);
    chunksRef.current = [];
  }, []);

  return {
    recordingBlob,
    isRecording,
    error,
    startRecording,
    stopRecording,
    clearRecording,
  };
}
