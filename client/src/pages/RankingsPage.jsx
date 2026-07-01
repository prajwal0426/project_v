import { Crown, Trophy } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import PageIntro from '../components/PageIntro.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import useApiResource from '../hooks/useApiResource.js';

export default function RankingsPage() {
  const { rankings, loadRankings } = useAppData();
  const { loading, error } = useApiResource(loadRankings, []);

  return (
    <section className="page">
      <PageIntro icon={Trophy} title="Monthly Rankings" text="Rankings are fetched from the VERTEX API and reflect database results only." />
      {loading ? <LoadingState label="Loading rankings..." /> : null}
      {error ? <EmptyState title="Rankings unavailable" message={error} /> : null}
      {!loading && !error && !rankings?.length ? <EmptyState title="No rankings available yet" /> : null}
      {rankings?.length ? (
        <>
          <div className="podium">
            {rankings.slice(0, 3).map((leader, index) => (
              <article className={`podium-card glass rank-${index + 1}`} key={leader?.id || leader?.user_id || leader?.name}>
                <Crown />
                <small>#{index + 1}</small>
                <h3>{leader?.name || 'Unnamed user'}</h3>
                <b>{leader?.badge || 'Unranked'}</b>
                <span>{Number(leader?.total_score ?? 0).toLocaleString()} pts</span>
              </article>
            ))}
          </div>
          <div className="leaderboard">
            {rankings.map((leader, index) => (
              <div className="leader-row" key={leader?.id || leader?.user_id || `${leader?.name}-${index}`}>
                <span>#{index + 1}</span>
                <strong>{leader?.name || 'Unnamed user'}</strong>
                <b>{leader?.badge || 'Unranked'}</b>
                <small>{Number(leader?.projects_completed ?? 0).toLocaleString()} projects</small>
                <em>{Number(leader?.total_score ?? 0).toLocaleString()}</em>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
