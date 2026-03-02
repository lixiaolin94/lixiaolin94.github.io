<script>
	import {
		calculateAndroidSplineTarget,
		calculateAndroidSplineVelocity,
		calculateAndroidDecayTarget,
		calculateAndroidDecayVelocity,
		calculateAppleScrollTarget,
		calculateAppleScrollVelocity
	} from '$lib/scroll-target/calculator';

	let velocity = $state(3000);
	let targetDistance = $state(500);
	let density = $state(3.5);
	let frictionMultiplier = $state(1);
	let absVelocityThreshold = $state(0.1);
	let decelerationRate = $state(0.998);

	let splineDistance = $derived(calculateAndroidSplineTarget(velocity, density).toFixed(2));
	let splineVelocity = $derived(calculateAndroidSplineVelocity(targetDistance, density).toFixed(2));
	let decayDistance = $derived(calculateAndroidDecayTarget(velocity, frictionMultiplier, absVelocityThreshold).toFixed(2));
	let decayVelocity = $derived(calculateAndroidDecayVelocity(targetDistance, frictionMultiplier, absVelocityThreshold).toFixed(2));
	let appleDistance = $derived(calculateAppleScrollTarget(velocity, decelerationRate).toFixed(2));
	let appleVelocity = $derived(calculateAppleScrollVelocity(targetDistance, decelerationRate).toFixed(2));
</script>

<svelte:head>
	<title>Calculate Scroll Target | Xiaolin</title>
</svelte:head>

<div class="page">
	<h1>Scroll Target Calculator</h1>

	<div class="input-section">
		<label>Initial Velocity (px/s): <input type="number" bind:value={velocity} step="100" /></label>
		<label>Target Distance (px): <input type="number" bind:value={targetDistance} step="100" /></label>
	</div>

	<section class="method-section">
		<h2>Android Spline (OverScroller)</h2>
		<label>Density: <input type="number" bind:value={density} step="0.1" /></label>
		<table>
			<thead><tr><th>Direction</th><th>Result</th></tr></thead>
			<tbody>
				<tr><td>Velocity → Distance</td><td>{splineDistance} px</td></tr>
				<tr><td>Distance → Velocity</td><td>{splineVelocity} px/s</td></tr>
			</tbody>
		</table>
	</section>

	<section class="method-section">
		<h2>Android Decay (FlingAnimation)</h2>
		<div class="params">
			<label>Friction Multiplier: <input type="number" bind:value={frictionMultiplier} step="0.1" /></label>
			<label>Abs Velocity Threshold: <input type="number" bind:value={absVelocityThreshold} step="0.01" /></label>
		</div>
		<table>
			<thead><tr><th>Direction</th><th>Result</th></tr></thead>
			<tbody>
				<tr><td>Velocity → Distance</td><td>{decayDistance} px</td></tr>
				<tr><td>Distance → Velocity</td><td>{decayVelocity} px/s</td></tr>
			</tbody>
		</table>
	</section>

	<section class="method-section">
		<h2>Apple ScrollView</h2>
		<label>Deceleration Rate:
			<select bind:value={decelerationRate}>
				<option value={0.998}>normal (0.998)</option>
				<option value={0.99}>fast (0.99)</option>
			</select>
		</label>
		<table>
			<thead><tr><th>Direction</th><th>Result</th></tr></thead>
			<tbody>
				<tr><td>Velocity → Distance</td><td>{appleDistance} px</td></tr>
				<tr><td>Distance → Velocity</td><td>{appleVelocity} px/s</td></tr>
			</tbody>
		</table>
	</section>
</div>

<style>
	.page {
		max-width: 800px;
		margin: 0 auto;
		padding: 1rem;
	}

	.input-section {
		display: flex;
		gap: 1.5rem;
		margin: 1rem 0;
		flex-wrap: wrap;
	}

	.method-section {
		margin: 2rem 0;
	}

	.params {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	input[type='number'] {
		width: 100px;
		padding: 0.4rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: 0.875rem;
	}

	table {
		border-collapse: collapse;
		width: 100%;
		margin: 0.5rem 0;
	}

	th, td {
		border: 1px solid var(--color-border);
		padding: 0.5rem;
		text-align: left;
		font-size: 0.875rem;
	}

	th {
		background-color: var(--color-muted);
	}
</style>
