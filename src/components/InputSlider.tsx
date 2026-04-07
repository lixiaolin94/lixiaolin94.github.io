import { useEffect, useState } from 'react';
import styles from '@/components/InputSlider.module.css';

type Props = {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
};

export function InputSlider({
  label = '',
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  onMouseDown,
  onMouseUp
}: Props) {
  const [numberInputTemp, setNumberInputTemp] = useState('');

  useEffect(() => {
    setNumberInputTemp('');
  }, [value]);

  function handleRangeInput(nextValue: string) {
    onChange?.(Number.parseFloat(nextValue));
  }

  function handleNumberCommit() {
    if (numberInputTemp !== '' && !Number.isNaN(Number(numberInputTemp))) {
      onChange?.(Number.parseFloat(numberInputTemp));
    }
    setNumberInputTemp('');
  }

  return (
    <div className={styles.inputSlider}>
      <input
        className={styles.range}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => handleRangeInput(event.target.value)}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
      />
      <input
        className={styles.number}
        type="number"
        value={numberInputTemp === '' ? value : numberInputTemp}
        step={step}
        onChange={(event) => setNumberInputTemp(event.target.value)}
        onBlur={handleNumberCommit}
      />
      <label className={styles.label}>{label}</label>
    </div>
  );
}
