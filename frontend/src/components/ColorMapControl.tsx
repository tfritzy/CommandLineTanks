import { useState } from "react";
import { type ColorMapPreset } from "../utils/ColorMapper";

interface ColorMapControlProps {
  onPresetChange: (preset: ColorMapPreset) => void;
}

const PRESETS: ColorMapPreset[] = [
  "none",
  "vintage",
  "noir",
  "warm",
  "cool",
  "vibrant",
  "muted",
];

const PRESET_LABELS: Record<ColorMapPreset, string> = {
  none: "None",
  vintage: "Vintage",
  noir: "Noir",
  warm: "Warm",
  cool: "Cool",
  vibrant: "Vibrant",
  muted: "Muted",
};

export default function ColorMapControl({
  onPresetChange,
}: ColorMapControlProps) {
  const [selectedPreset, setSelectedPreset] = useState<ColorMapPreset>("none");
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePresetChange = (preset: ColorMapPreset) => {
    setSelectedPreset(preset);
    onPresetChange(preset);
  };

  return (
    <div className="absolute bottom-20 right-4 z-50">
      <div className="bg-palette-bg-dark/90 border border-palette-outline rounded-lg p-2 backdrop-blur-sm">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-palette-text text-sm px-3 py-1 hover:bg-palette-bg-light/20 rounded transition-colors"
        >
          Color Filter: {PRESET_LABELS[selectedPreset]}
        </button>
        {isExpanded && (
          <div className="mt-2 space-y-1">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  handlePresetChange(preset);
                  setIsExpanded(false);
                }}
                className={`block w-full text-left px-3 py-1 text-sm rounded transition-colors ${
                  selectedPreset === preset
                    ? "bg-palette-accent text-palette-bg-dark"
                    : "text-palette-text hover:bg-palette-bg-light/20"
                }`}
              >
                {PRESET_LABELS[preset]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
