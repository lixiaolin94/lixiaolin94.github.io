<script>
	let { label = '', value = $bindable(0), min = 0, max = 100, step = 1, oninput } = $props();

	let numberInputTemp = '';
	let numberInput;

	function handleRangeInput(e) {
		value = parseFloat(e.target.value);
		oninput?.(value);
	}

	function handleNumberInput(e) {
		numberInputTemp = e.target.value;
	}

	function handleNumberChange(e) {
		if (numberInputTemp !== '' && !isNaN(Number(numberInputTemp))) {
			value = parseFloat(numberInputTemp);
			oninput?.(value);
		}
		numberInputTemp = '';
	}
</script>

<div class="input-slider">
	<input type="range" {min} {max} {step} value={value} oninput={handleRangeInput} />
	<input
		type="number"
		bind:this={numberInput}
		value={value}
		{step}
		oninput={handleNumberInput}
		onchange={handleNumberChange}
	/>
	<label>{label}</label>
</div>

<style>
	.input-slider {
		position: relative;
		height: 2rem;
		padding: 0;
		overflow: hidden;
		box-sizing: border-box;
		font-family: var(--font-mono);
		font-size: 0.875rem;
		background-color: var(--color-input);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-large);
		transition: border-color 0.1s;
	}

	.input-slider:focus-within {
		border-color: var(--color-primary);
	}

	input[type='range'] {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		cursor: pointer;
		background: none;
		appearance: none;
		-webkit-appearance: none;
		overflow: hidden;
	}

	input[type='range']::-webkit-slider-thumb {
		width: 0;
		appearance: none;
		-webkit-appearance: none;
		box-shadow: -999px 0 0 999px var(--color-border);
		transition: box-shadow 0.1s;
	}

	input[type='range']:focus::-webkit-slider-thumb {
		box-shadow: -999px 0 0 999px var(--color-primary);
	}

	input[type='range']::-moz-range-thumb {
		box-shadow: -999px 0 0 999px var(--color-primary);
	}

	input[type='number'] {
		position: absolute;
		top: 50%;
		right: 0.75rem;
		transform: translateY(-50%);
		width: 4.5ch;
		font-family: var(--font-mono);
		font-size: 0.875rem;
		line-height: 1.25rem;
		text-align: right;
		background: none;
		border: none;
		appearance: none;
		-moz-appearance: textfield;
		color: var(--color-primary-foreground);
		mix-blend-mode: difference;
	}

	input[type='number']::-webkit-outer-spin-button,
	input[type='number']::-webkit-inner-spin-button {
		margin: 0;
		-webkit-appearance: none;
	}

	input[type='number']:focus {
		outline: none;
	}

	label {
		user-select: none;
		position: absolute;
		top: 50%;
		left: 0.75rem;
		transform: translateY(-50%);
		pointer-events: none;
		color: var(--color-primary-foreground);
		mix-blend-mode: difference;
	}
</style>
