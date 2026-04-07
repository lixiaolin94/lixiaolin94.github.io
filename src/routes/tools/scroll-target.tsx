import {
  calculateAndroidDecayTarget,
  calculateAndroidDecayVelocity,
  calculateAndroidSplineTarget,
  calculateAndroidSplineVelocity,
  calculateAppleScrollTarget,
  calculateAppleScrollVelocity
} from '@/lib/scroll-target/calculator';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useMemo, useState } from 'react';

function format(value: number) {
  return value.toFixed(2);
}

export function Component() {
  useDocumentTitle('Scroll Target Calculator | Xiaolin');

  const [velocity, setVelocity] = useState(3000);
  const [targetDistance, setTargetDistance] = useState(500);
  const [density, setDensity] = useState(3.5);
  const [frictionMultiplier, setFrictionMultiplier] = useState(1);
  const [absVelocityThreshold, setAbsVelocityThreshold] = useState(0.1);
  const [decelerationRate, setDecelerationRate] = useState(0.998);

  const results = useMemo(
    () => ({
      splineDistance: format(calculateAndroidSplineTarget(velocity, density)),
      splineVelocity: format(calculateAndroidSplineVelocity(targetDistance, density)),
      decayDistance: format(calculateAndroidDecayTarget(velocity, frictionMultiplier, absVelocityThreshold)),
      decayVelocity: format(calculateAndroidDecayVelocity(targetDistance, frictionMultiplier, absVelocityThreshold)),
      appleDistance: format(calculateAppleScrollTarget(velocity, decelerationRate)),
      appleVelocity: format(calculateAppleScrollVelocity(targetDistance, decelerationRate))
    }),
    [absVelocityThreshold, decelerationRate, density, frictionMultiplier, targetDistance, velocity]
  );

  return (
    <main className="tool-page stack">
      <h1>Scroll Target Calculator</h1>

      <div className="inline-fields">
        <label className="field-inline">
          Initial Velocity (px/s)
          <input type="number" value={velocity} step="100" onChange={(e) => setVelocity(Number(e.target.value))} />
        </label>
        <label className="field-inline">
          Target Distance (px)
          <input
            type="number"
            value={targetDistance}
            step="100"
            onChange={(e) => setTargetDistance(Number(e.target.value))}
          />
        </label>
      </div>

      <section className="stack">
        <h2>Android Spline (OverScroller)</h2>
        <label className="field-inline">
          Density
          <input type="number" value={density} step="0.1" onChange={(e) => setDensity(Number(e.target.value))} />
        </label>
        <table className="table">
          <thead>
            <tr>
              <th>Direction</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Velocity to Distance</td>
              <td>{results.splineDistance} px</td>
            </tr>
            <tr>
              <td>Distance to Velocity</td>
              <td>{results.splineVelocity} px/s</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="stack">
        <h2>Android Decay (FlingAnimation)</h2>
        <div className="inline-fields">
          <label className="field-inline">
            Friction Multiplier
            <input
              type="number"
              value={frictionMultiplier}
              step="0.1"
              onChange={(e) => setFrictionMultiplier(Number(e.target.value))}
            />
          </label>
          <label className="field-inline">
            Abs Velocity Threshold
            <input
              type="number"
              value={absVelocityThreshold}
              step="0.01"
              onChange={(e) => setAbsVelocityThreshold(Number(e.target.value))}
            />
          </label>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Direction</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Velocity to Distance</td>
              <td>{results.decayDistance} px</td>
            </tr>
            <tr>
              <td>Distance to Velocity</td>
              <td>{results.decayVelocity} px/s</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="stack">
        <h2>Apple ScrollView</h2>
        <label className="field-inline">
          Deceleration Rate
          <select value={decelerationRate} onChange={(e) => setDecelerationRate(Number(e.target.value))}>
            <option value={0.998}>normal (0.998)</option>
            <option value={0.99}>fast (0.99)</option>
          </select>
        </label>
        <table className="table">
          <thead>
            <tr>
              <th>Direction</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Velocity to Distance</td>
              <td>{results.appleDistance} px</td>
            </tr>
            <tr>
              <td>Distance to Velocity</td>
              <td>{results.appleVelocity} px/s</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
