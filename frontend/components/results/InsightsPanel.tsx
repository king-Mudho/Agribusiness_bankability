import type { ResultsPayload } from "@/types/api";

/**
 * "What would move the score" insights. Every number is computed by the
 * backend (apps/assessments/insights.py) from the stored scores and the
 * framework's own weights and band thresholds -- this component only
 * renders them.
 */
export function InsightsPanel({ results }: { results: ResultsPayload }) {
  const insights = results.insights;
  if (!insights) return null;

  const { next_band: nextBand, improvement_potential: potential, peer_benchmark: peer } = insights;
  const topGains = potential.filter((row) => row.potential_points > 0).slice(0, 3);
  const maxGain = Math.max(...potential.map((row) => row.potential_points), 1);

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <div>
        <h2 className="text-lg font-semibold text-text">Insights</h2>
        <p className="text-xs text-text-muted">
          Indicative guidance on where effort would move the ABI score most.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Next band */}
        <div className="rounded-md bg-bg p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Next readiness band</p>
          {nextBand ? (
            <>
              <p className="mt-1 text-2xl font-bold tabular-nums text-text">
                +{nextBand.points_needed}
                <span className="ml-1 text-sm font-normal text-text-muted">points</span>
              </p>
              <p className="text-sm text-text-muted">
                to reach <span className="font-medium text-text">{nextBand.label}</span> ({nextBand.min_score}+)
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border" aria-hidden>
                <div
                  className="h-full rounded-full bg-header"
                  style={{ width: `${Math.min(100, (results.abi_score / nextBand.min_score) * 100)}%` }}
                />
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-text">Already in the highest readiness band.</p>
          )}
        </div>

        {/* Biggest gains */}
        <div className="rounded-md bg-bg p-4 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Where improvement adds the most points
          </p>
          {topGains.length === 0 ? (
            <p className="mt-1 text-sm text-text">All dimensions are already at the maximum.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {topGains.map((row) => (
                <li key={row.dimension_code} className="flex flex-col gap-1">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="text-text">
                      {row.dimension}{" "}
                      <span className="text-xs text-text-muted">
                        (score {Math.round(row.score)}, weight {row.weight_percent}%)
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums text-header">up to +{row.potential_points}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border" aria-hidden>
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(row.potential_points / maxGain) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-text-muted">
            Points the overall score would gain if that dimension reached 100, given its weight.
          </p>
        </div>
      </div>

      {/* Peer comparison */}
      <div className="rounded-md bg-bg p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Peer comparison</p>
        {peer && peer.average_abi !== null ? (
          <>
            <p className="mt-1 text-sm text-text">
              Compared with <span className="font-medium">{peer.label}</span> ({peer.sample_size} other
              assessed enterprises): average ABI{" "}
              <span className="font-semibold tabular-nums">{Math.round(peer.average_abi)}</span>, this enterprise{" "}
              <span className="font-semibold tabular-nums">{Math.round(results.abi_score)}</span>.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-text-muted">
                    <th className="py-1 font-medium">Dimension</th>
                    <th className="py-1 text-right font-medium">This enterprise</th>
                    <th className="py-1 text-right font-medium">Peer average</th>
                    <th className="py-1 text-right font-medium">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {results.dimension_scores.map((d) => {
                    const peerAvg = peer.dimension_averages[d.dimension_code];
                    const diff = peerAvg === undefined ? null : d.score - peerAvg;
                    return (
                      <tr key={d.dimension_code} className="border-t border-border">
                        <td className="py-1.5 text-text">{d.dimension}</td>
                        <td className="py-1.5 text-right tabular-nums">{Math.round(d.score)}</td>
                        <td className="py-1.5 text-right tabular-nums text-text-muted">
                          {peerAvg === undefined ? "-" : Math.round(peerAvg)}
                        </td>
                        <td
                          className={`py-1.5 text-right font-medium tabular-nums ${
                            diff === null ? "" : diff >= 0 ? "text-success" : "text-danger"
                          }`}
                        >
                          {diff === null ? "-" : `${diff >= 0 ? "+" : ""}${Math.round(diff)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-text-muted">
              Pilot data only, not a national benchmark. Averages are shown only when at least{" "}
              {insights.min_peer_sample} other enterprises contribute.
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-text-muted">
            Not enough comparable assessments yet (needs at least {insights.min_peer_sample}).
          </p>
        )}
      </div>
    </section>
  );
}
