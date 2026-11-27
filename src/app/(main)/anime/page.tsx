import { redirect } from 'next/navigation';

export default async function AnimeRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; status?: string }>;
}) {
  const params = await searchParams;
  if (params.sort === 'trending') {
    redirect('/search?type=ANIME&sort=TRENDING_DESC');
  }
  if (params.sort === 'top-rated') {
    redirect('/search?type=ANIME&sort=SCORE_DESC');
  }
  if (params.status === 'upcoming') {
    redirect('/search?type=ANIME&sort=POPULARITY_DESC');
  }
  redirect('/search?type=ANIME');
}
