type PhotoDropProps = {
  onFile: (file: File) => void;
  disabled?: boolean;
  label?: string;
};

export function PhotoDrop({ onFile, disabled, label = "選擇照片／舊海報／截圖" }: PhotoDropProps) {
  return (
    <label className="mt-1.5 flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-surface-2 px-3 text-center text-sm">
      {label}
      <input
        type="file"
        accept="image/*"
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}
