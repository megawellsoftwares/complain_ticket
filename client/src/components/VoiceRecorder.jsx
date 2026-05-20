import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function VoiceRecorder({ onRecordingComplete, onCancel }) {
  const { t } = useTranslation();
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!blob) {
      setAudioUrl(null);
      return;
    }
    const u = URL.createObjectURL(blob);
    setAudioUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);

  async function startRecording() {
    chunksRef.current = [];
    setRecordingSeconds(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      // Prefer high quality mime types
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mr = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000, // High quality 128kbps
      });

      mediaRecorderRef.current = mr;
      mr.ondataavailable = (ev) => {
        if (ev.data.size) chunksRef.current.push(ev.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const b = new Blob(chunksRef.current, { type: mr.mimeType });
        setBlob(b);
        setDuration(recordingSeconds);
        onRecordingComplete(b);
      };
      mr.start();
      setRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingSeconds((sec) => sec + 1);
      }, 1000);
    } catch (e) {
      console.error("Recording error:", e);
      alert(t("Could not start recording. Please check microphone permissions."));
    }
  }

  function stopRecording() {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
  }

  return (
    <div className="voice-recorder stack" style={{ padding: "1rem", background: "rgba(255,255,255,0.05)", borderRadius: "12px", border: "1px dashed var(--border)" }}>
      <label style={{ fontWeight: "600" }}>{t("Record what happens")}</label>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {!recording ? (
            <button type="button" className="btn btn-primary" onClick={startRecording}>
              {t("Start recording")}
            </button>
          ) : (
            <button type="button" className="btn btn-danger" onClick={stopRecording}>
              {t("Stop")}
            </button>
          )}
          {onCancel && !recording && (
             <button type="button" className="btn btn-secondary" onClick={onCancel}>
               {t("Cancel")}
             </button>
          )}
        </div>
        {recording && (
          <div style={{ color: "#e94c3c", fontWeight: "700", fontSize: "1.1rem" }}>
            ⏱️ {formatTime(recordingSeconds)}
          </div>
        )}
      </div>
      {audioUrl ? <audio className="audio-player" controls src={audioUrl} style={{ marginTop: "0.5rem" }} /> : null}
      {blob && !recording && (
        <span className="muted" style={{ fontSize: "0.8rem" }}>
          {t("Captured")} ({Math.round(blob.size / 1024)} KB) • {t("Duration")}: {formatTime(duration)}
        </span>
      )}
    </div>
  );
}
