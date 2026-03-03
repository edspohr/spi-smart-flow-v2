import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

interface ColorPickerProps {
  colors: string[];
  onChange: (colors: string[]) => void;
}

const ColorPicker = ({ colors, onChange }: ColorPickerProps) => {
  const [currentColor, setCurrentColor] = useState('#0033A0');

  const addColor = () => {
    if (currentColor && !colors.includes(currentColor)) {
      onChange([...colors, currentColor]);
    }
  };

  const removeColor = (index: number) => {
    onChange(colors.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="w-12 h-12 rounded-xl border-2 border-slate-200 cursor-pointer p-0.5 bg-white shadow-sm hover:border-blue-400 transition-colors"
          />
        </div>
        <Input
          type="text"
          value={currentColor}
          onChange={(e) => setCurrentColor(e.target.value)}
          placeholder="#0033A0 o PMS 286C"
          className="flex-1 h-12 rounded-xl border-slate-200 font-mono text-sm uppercase"
        />
        <Button
          type="button"
          onClick={addColor}
          variant="outline"
          className="h-12 px-4 rounded-xl border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
        >
          <Plus className="h-4 w-4 mr-1" /> Agregar
        </Button>
      </div>

      {colors.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {colors.map((color, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div
                className="w-8 h-8 rounded-lg border border-slate-200 shadow-inner"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-mono font-bold text-slate-600 uppercase">{color}</span>
              <button
                type="button"
                onClick={() => removeColor(index)}
                className="ml-1 p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {colors.length === 0 && (
        <p className="text-xs text-slate-400 italic">
          Selecciona colores usando el selector visual o escribe el código hex/Pantone.
        </p>
      )}
    </div>
  );
};

export default ColorPicker;
