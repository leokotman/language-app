import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

describe("useAudioRecorder", () => {
  let mockGetUserMedia: ReturnType<typeof vi.fn>;
  let mockStreamTracks: { stop: ReturnType<typeof vi.fn> }[];
  let recorderInstance: {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    state: string;
    ondataavailable: ((e: { data: Blob }) => void) | null;
    onstop: (() => void) | null;
  };
  let isTypeSupportedOpus: boolean;

  beforeEach(() => {
    mockStreamTracks = [{ stop: vi.fn() }];
    mockGetUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => mockStreamTracks,
    });
    isTypeSupportedOpus = true;
    recorderInstance = {
      start: vi.fn(),
      stop: vi.fn(),
      state: "recording",
      ondataavailable: null,
      onstop: null,
    };

    Object.defineProperty(globalThis, "navigator", {
      value: {
        mediaDevices: {
          getUserMedia: mockGetUserMedia,
        },
      },
      writable: true,
    });
    globalThis.MediaRecorder = class {
      constructor() {
        return recorderInstance as unknown as MediaRecorder;
      }
      static isTypeSupported(type: string): boolean {
        return type === "audio/webm;codecs=opus" ? isTypeSupportedOpus : false;
      }
    } as unknown as typeof MediaRecorder;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns initial state and handlers", () => {
    const { result } = renderHook(() => useAudioRecorder());
    expect(result.current.recordingBlob).toBeNull();
    expect(result.current.isRecording).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.startRecording).toBe("function");
    expect(typeof result.current.stopRecording).toBe("function");
    expect(typeof result.current.clearRecording).toBe("function");
  });

  it("startRecording gets stream and sets isRecording on success", async () => {
    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => {
      result.current.startRecording();
    });
    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
    await waitFor(() => {
      expect(result.current.isRecording).toBe(true);
    });
  });

  it("startRecording uses opus when supported", async () => {
    isTypeSupportedOpus = true;
    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => {
      result.current.startRecording();
    });
    await waitFor(() => {
      expect(recorderInstance.start).toHaveBeenCalledWith(200);
    });
    await act(() => {
      recorderInstance.ondataavailable?.({ data: new Blob(["x"]) });
      recorderInstance.onstop?.();
    });
    await waitFor(() => {
      expect(result.current.recordingBlob).not.toBeNull();
    });
    expect(result.current.recordingBlob?.type).toBe("audio/webm;codecs=opus");
  });

  it("startRecording uses audio/webm when opus not supported", async () => {
    isTypeSupportedOpus = false;
    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => {
      result.current.startRecording();
    });
    await waitFor(() => {
      expect(recorderInstance.start).toHaveBeenCalled();
    });
    await act(() => {
      recorderInstance.ondataavailable?.({ data: new Blob(["x"]) });
      recorderInstance.onstop?.();
    });
    await waitFor(() => {
      expect(result.current.recordingBlob).not.toBeNull();
    });
    expect(result.current.recordingBlob?.type).toBe("audio/webm");
  });

  it("startRecording sets error when getUserMedia rejects with Error", async () => {
    mockGetUserMedia.mockRejectedValue(new Error("Permission denied"));
    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => {
      result.current.startRecording();
    });
    await waitFor(() => {
      expect(result.current.error).toBe("Permission denied");
    });
    expect(result.current.isRecording).toBe(false);
  });

  it("startRecording sets error when getUserMedia rejects with non-Error", async () => {
    mockGetUserMedia.mockRejectedValue("string error");
    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => {
      result.current.startRecording();
    });
    await waitFor(() => {
      expect(result.current.error).toBe("Microphone access failed");
    });
  });

  it("ondataavailable only pushes when data.size > 0", async () => {
    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => {
      result.current.startRecording();
    });
    await waitFor(() => {
      expect(recorderInstance.ondataavailable).not.toBeNull();
    });
    await act(() => {
      recorderInstance.ondataavailable?.({ data: new Blob([]) });
      recorderInstance.ondataavailable?.({ data: new Blob(["chunk"]) });
      recorderInstance.onstop?.();
    });
    await waitFor(() => {
      expect(result.current.recordingBlob).not.toBeNull();
    });
    expect(result.current.recordingBlob?.size).toBeGreaterThan(0);
  });

  it("onstop does not set blob when no chunks", async () => {
    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => {
      result.current.startRecording();
    });
    await waitFor(() => {
      expect(recorderInstance.onstop).not.toBeNull();
    });
    await act(() => {
      recorderInstance.onstop?.();
    });
    await waitFor(() => {
      expect(result.current.recordingBlob).toBeNull();
    });
  });

  it("stopRecording stops recorder when active", async () => {
    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => {
      result.current.startRecording();
    });
    await waitFor(() => {
      expect(result.current.isRecording).toBe(true);
    });
    await act(() => {
      result.current.stopRecording();
    });
    expect(recorderInstance.stop).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
  });

  it("stopRecording no-ops when not recording", () => {
    const { result } = renderHook(() => useAudioRecorder());
    act(() => {
      result.current.stopRecording();
    });
    expect(recorderInstance.stop).not.toHaveBeenCalled();
  });

  it("stopRecording no-ops when recorder state is inactive", async () => {
    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => {
      result.current.startRecording();
    });
    await waitFor(() => {
      expect(result.current.isRecording).toBe(true);
    });
    recorderInstance.state = "inactive";
    act(() => {
      result.current.stopRecording();
    });
    expect(recorderInstance.stop).not.toHaveBeenCalled();
  });

  it("clearRecording resets blob and error", async () => {
    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => {
      result.current.startRecording();
    });
    await waitFor(() => {
      expect(recorderInstance.ondataavailable).not.toBeNull();
    });
    await act(() => {
      recorderInstance.ondataavailable?.({ data: new Blob(["x"]) });
      recorderInstance.onstop?.();
    });
    await waitFor(() => {
      expect(result.current.recordingBlob).not.toBeNull();
    });
    act(() => {
      result.current.clearRecording();
    });
    expect(result.current.recordingBlob).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
