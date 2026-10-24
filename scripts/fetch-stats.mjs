import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { siDocker, siGit, siGithub, siKubernetes, siPostgresql, siSpringboot } from 'simple-icons';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const USER = 'VictorHNL';
const STATS_PATH = resolve(ROOT, 'stats.json');
const SOURCE_PATH = resolve(ROOT, 'readme.source.md');
const BUILD_SOURCE_PATH = resolve(ROOT, 'readme.build.source.md');
const FONTS_DIR = resolve(ROOT, '.github/fonts');
const TOKEN = process.env.GH_STATS_TOKEN || process.env.GITHUB_TOKEN || '';
const API = 'https://api.github.com';

const unavailable = {
  username: USER,
  fetchedAt: null,
  repos: null,
  stars: null,
  forks: null,
  followers: null,
  totalCommits: null,
  contributionsYear: null,
  contributionsAll: null,
  currentStreak: null,
  longestStreak: null,
  languages: [],
  primaryLanguages: [],
  projects: [],
  activity: [],
  contributionNote: 'Contribuições e streaks indisponíveis: configure GH_STATS_TOKEN com escopo read:user.',
};

function headers() {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'VictorHNL-profile-readme',
    ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
  };
}

async function getJson(url) {
  const response = await fetch(url, { headers: headers(), signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`GitHub API ${response.status} for ${url}`);
  return response.json();
}

async function getAllRepos() {
  const repos = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await getJson(`${API}/users/${USER}/repos?type=owner&per_page=100&sort=updated&page=${page}`);
    if (!Array.isArray(batch)) throw new Error('Unexpected response while listing repositories.');
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos;
}

function cleanMarkdownDescription(markdown) {
  const lines = markdown.split(/\r?\n/).map((line) => line.trim());
  const paragraph = [];
  let started = false;
  for (const line of lines) {
    if (!line) {
      if (started) break;
      continue;
    }
    if (/^#|^!\[|^<|^\|[-:| ]+\|?$|^[-*_]{3,}$|^```/.test(line)) continue;
    if (/^\[[^\]]+\]:/.test(line)) continue;
    if (/^\[[^\]]+\]\([^)]*\)$/.test(line) || /^\[!/.test(line)) continue;
    paragraph.push(line);
    started = true;
  }
  return paragraph.join(' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150) || 'Sem descrição no README do projeto.';
}

async function getReadmeDescription(repo) {
  if (repo.description?.trim()) return repo.description.trim().slice(0, 150);
  try {
    const result = await getJson(`${API}/repos/${USER}/${repo.name}/readme`);
    if (result.encoding === 'base64' && result.content) {
      return cleanMarkdownDescription(Buffer.from(result.content, 'base64').toString('utf8'));
    }
  } catch {
    // A repository without an accessible README keeps the explicit missing-data label.
  }
  return 'Sem descrição no README do projeto.';
}

async function fetchPublicStats(previous = null) {
  const [user, repoList] = await Promise.all([
    getJson(`${API}/users/${USER}`),
    getAllRepos(),
  ]);
  const repos = repoList.filter((repo) => !repo.fork);
  const languageBytes = new Map();
  const languageRepos = new Map();

  for (const repo of repos) {
    if (repo.language) languageRepos.set(repo.language, (languageRepos.get(repo.language) || 0) + 1);
    try {
      const sizes = await getJson(`${API}/repos/${USER}/${repo.name}/languages`);
      for (const [language, bytes] of Object.entries(sizes)) {
        languageBytes.set(language, (languageBytes.get(language) || 0) + bytes);
      }
    } catch {
      // One unavailable repository language map does not hide the rest.
    }
  }

  const byteTotal = [...languageBytes.values()].reduce((sum, bytes) => sum + bytes, 0);
  const languages = [...languageBytes.entries()]
    .map(([name, bytes]) => ({ name, percentage: byteTotal ? Math.round(bytes * 100 / byteTotal) : 0 }))
    .sort((a, b) => b.percentage - a.percentage || a.name.localeCompare(b.name))
    .slice(0, 5);
  const primaryTotal = [...languageRepos.values()].reduce((sum, count) => sum + count, 0);
  const primaryLanguages = [...languageRepos.entries()]
    .map(([name, count]) => ({ name, percentage: primaryTotal ? Math.round(count * 100 / primaryTotal) : 0 }))
    .sort((a, b) => b.percentage - a.percentage || a.name.localeCompare(b.name))
    .slice(0, 5);

  const candidates = repos
    .filter((repo) => repo.name !== USER)
    .sort((a, b) => b.stargazers_count - a.stargazers_count || Date.parse(b.pushed_at || b.updated_at) - Date.parse(a.pushed_at || a.updated_at))
    .slice(0, 3);

  const projects = [];
  const activity = [];
  for (const repo of candidates) {
    let description = await getReadmeDescription(repo);
    const cachedProject = previous?.projects?.find((item) => item.name === repo.name);
    if (description === 'Sem descrição no README do projeto.' && cachedProject?.description && cachedProject.description !== 'Sem descrição no README do projeto.') {
      description = cachedProject.description;
    }
    projects.push({
      name: repo.name,
      description,
      language: repo.language,
      url: repo.html_url,
      stars: repo.stargazers_count,
      pushedAt: repo.pushed_at,
    });
    try {
      const commits = await getJson(`${API}/repos/${USER}/${repo.name}/commits?per_page=1`);
      const latest = commits[0];
      if (latest) {
        activity.push({
          repo: repo.name,
          date: new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(latest.commit.author?.date || latest.commit.committer?.date)),
          message: (latest.commit.message || '').split('\n')[0].slice(0, 68),
          url: latest.html_url,
        });
      }
    } catch {
      const cachedActivity = previous?.activity?.find((item) => item.repo === repo.name);
      if (cachedActivity) activity.push(cachedActivity);
    }
  }

  const apiRepos = repoList;
  return {
    username: USER,
    fetchedAt: new Date().toISOString(),
    repos: user.public_repos,
    stars: apiRepos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0),
    forks: apiRepos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0),
    followers: user.followers,
    totalCommits: null,
    contributionsYear: null,
    contributionsAll: null,
    currentStreak: null,
    longestStreak: null,
    languages: languages.length ? languages : (previous?.languages || []),
    primaryLanguages: primaryLanguages.length ? primaryLanguages : (previous?.primaryLanguages || []),
    projects,
    activity: activity.length ? activity : (previous?.activity || []),
    contributionNote: 'Contribuições e streaks indisponíveis: configure GH_STATS_TOKEN com escopo read:user.',
  };
}

const CONTRIBUTIONS_QUERY = `
query($login: String!, $fromYear: DateTime!, $fromAll: DateTime!, $to: DateTime!) {
  user(login: $login) {
    year: contributionsCollection(from: $fromYear, to: $to) {
      totalContributions
    }
    all: contributionsCollection(from: $fromAll, to: $to) {
      totalContributions
      contributionCalendar {
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}`;

function dateBefore(dateText) {
  const date = new Date(`${dateText}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function streaks(weeks) {
  const days = weeks.flatMap((week) => week.contributionDays).sort((a, b) => a.date.localeCompare(b.date));
  const counts = new Map(days.map((day) => [day.date, day.contributionCount]));
  const dates = new Set(days.filter((day) => day.contributionCount > 0).map((day) => day.date));
  let longest = 0;
  let run = 0;
  for (const day of days) {
    if (day.contributionCount > 0) {
      run++;
      longest = Math.max(longest, run);
    } else run = 0;
  }
  const today = new Date().toISOString().slice(0, 10);
  let anchor = dates.has(today) ? today : dateBefore(today);
  let current = 0;
  while (counts.has(anchor) && dates.has(anchor)) {
    current++;
    anchor = dateBefore(anchor);
  }
  return { current, longest };
}

async function fetchContributions(accountCreatedAt) {
  if (!TOKEN) throw new Error('No GH_STATS_TOKEN/GITHUB_TOKEN available for GraphQL.');
  const now = new Date();
  const yearStart = new Date(now);
  yearStart.setUTCDate(yearStart.getUTCDate() - 365);
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: CONTRIBUTIONS_QUERY,
      variables: {
        login: USER,
        fromYear: yearStart.toISOString(),
        fromAll: accountCreatedAt,
        to: now.toISOString(),
      },
    }),
    signal: AbortSignal.timeout(30000),
  });
  const result = await response.json();
  if (!response.ok || result.errors?.length || !result.data?.user) {
    throw new Error(result.errors?.map((error) => error.message).join('; ') || `GraphQL ${response.status}`);
  }
  const all = result.data.user.all;
  const streak = streaks(all.contributionCalendar.weeks);
  return {
    contributionsYear: result.data.user.year.totalContributions,
    contributionsAll: all.totalContributions,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    contributionNote: process.env.GH_STATS_TOKEN
      ? ''
      : 'Usando GITHUB_TOKEN: os totais podem não incluir contribuições privadas. Configure GH_STATS_TOKEN com escopo read:user para os totais completos.',
  };
}

function iconUri(icon, color = '#c084fc') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${color}" d="${icon.path}"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function customIcon(name) {
  const paths = {
    java: '<path d="M6 10h10v5a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4z"/><path d="M16 11h1a2 2 0 0 1 0 4h-1M4 21h14M9 3c-2 2 2 2 0 4M13 3c-2 2 2 2 0 4"/>',
    linkedin: '<circle cx="5" cy="6" r="1.5" fill="#c084fc" stroke="none"/><path d="M4 10h2v10H4zM9 10h2v1.5c.8-1.2 1.8-1.7 3.2-1.7 2.5 0 3.8 1.6 3.8 4.3V20h-2v-5.4c0-1.8-.7-2.8-2.2-2.8-1.7 0-2.8 1.2-2.8 3.2V20H9z"/>',
    scrum: '<path d="M5 8a8 8 0 0 1 13-2l2 2M19 16a8 8 0 0 1-13 2l-2-2"/><path d="M17 4v4h4M7 20v-4H3"/>',
    microservices: '<path d="M12 12 5 5M12 12l7-7M12 12l-7 7M12 12l7 7"/><circle cx="12" cy="12" r="3"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>',
    rest: '<rect x="2.5" y="4" width="7" height="6" rx="1"/><rect x="14.5" y="4" width="7" height="6" rx="1"/><rect x="8.5" y="15" width="7" height="6" rx="1"/><path d="M9.5 7h5M6 10v3.5h6M18 10v3.5h-6"/>',
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
  const filledSvg = name === 'linkedin'
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#c084fc">${paths[name]}</svg>`
    : svg;
  return `data:image/svg+xml;base64,${Buffer.from(filledSvg).toString('base64')}`;
}

function unavailableString(value) {
  return value == null ? null : value;
}

async function main() {
  let previous = null;
  try { previous = JSON.parse(await readFile(STATS_PATH, 'utf8')); } catch { /* first run */ }

  let profile;
  try {
    profile = await fetchPublicStats(previous);
    try {
      const user = await getJson(`${API}/users/${USER}`);
      const contributions = await fetchContributions(user.created_at);
      profile = { ...profile, ...contributions, totalCommits: previous?.totalCommits ?? null };
    } catch (error) {
      if (previous) {
        const hasCachedContributions = previous.contributionsYear != null && previous.contributionsAll != null && previous.currentStreak != null && previous.longestStreak != null;
        profile = { ...profile,
          contributionsYear: unavailableString(previous.contributionsYear),
          contributionsAll: unavailableString(previous.contributionsAll),
          currentStreak: unavailableString(previous.currentStreak),
          longestStreak: unavailableString(previous.longestStreak),
          totalCommits: previous.totalCommits ?? null,
          contributionNote: hasCachedContributions
            ? `Contribuições/streaks em cache (${previous.fetchedAt || 'data anterior'}); configure GH_STATS_TOKEN (read:user) para atualizar.`
            : 'Contribuições e streaks indisponíveis: configure o secret GH_STATS_TOKEN com escopo read:user nos GitHub Actions Secrets.',
        };
      } else {
        profile.contributionNote = `Contribuições/streaks indisponíveis: ${error.message} Configure GH_STATS_TOKEN com escopo read:user.`;
      }
    }
    await writeFile(STATS_PATH, `${JSON.stringify(profile, null, 2)}\n`, 'utf8');
  } catch (error) {
    if (previous) {
      profile = previous;
      profile.contributionNote ||= `API indisponível; usando o último stats.json (${previous.fetchedAt || 'data desconhecida'}).`;
      console.warn(`GitHub API indisponível; mantendo stats.json salvo: ${error.message}`);
    } else {
      profile = unavailable;
      profile.contributionNote = `Dados GitHub indisponíveis: ${error.message}.`;
      console.warn(profile.contributionNote);
      await writeFile(STATS_PATH, `${JSON.stringify(profile, null, 2)}\n`, 'utf8');
    }
  }

  const iconMap = {
    ICON_GITHUB: iconUri(siGithub),
    ICON_LINKEDIN: customIcon('linkedin'),
    ICON_JAVA: customIcon('java'),
    ICON_SPRINGBOOT: iconUri(siSpringboot),
    ICON_DOCKER: iconUri(siDocker),
    ICON_KUBERNETES: iconUri(siKubernetes),
    ICON_POSTGRESQL: iconUri(siPostgresql),
    ICON_REST: customIcon('rest'),
    ICON_GIT: iconUri(siGit),
    ICON_SCRUM: customIcon('scrum'),
    ICON_MICROSERVICES: customIcon('microservices'),
  };

  let source = await readFile(SOURCE_PATH, 'utf8');
  source = source.replaceAll('__PROFILE_DATA__', JSON.stringify(profile));
  source = source.replaceAll('__PROJECT_0_URL__', profile.projects?.[0]?.url || 'https://github.com/VictorHNL');
  source = source.replaceAll('__PROJECT_1_URL__', profile.projects?.[1]?.url || 'https://github.com/VictorHNL');
  source = source.replaceAll('__PROJECT_2_URL__', profile.projects?.[2]?.url || 'https://github.com/VictorHNL');
  for (const [key, uri] of Object.entries(iconMap)) source = source.replaceAll(`__${key}__`, JSON.stringify(uri));
  const buildTime = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }).format(new Date());
  source = source.replaceAll('__BUILD_TIME__', buildTime);
  await writeFile(BUILD_SOURCE_PATH, source, 'utf8');

  const bundledFont = resolve(ROOT, 'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff');
  await mkdir(FONTS_DIR, { recursive: true });
  await copyFile(bundledFont, resolve(FONTS_DIR, 'JetBrainsMono-Regular.woff'));
  console.log(`Stats prepared for ${USER}; ${profile.projects?.length || 0} project cards, ${profile.languages?.length || 0} byte-based language entries.`);
  if (profile.contributionsYear == null) console.warn(profile.contributionNote);
}

await main();
