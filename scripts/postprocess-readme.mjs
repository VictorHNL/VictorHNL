import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const README = resolve(ROOT, 'README.md');
const stats = JSON.parse(await readFile(resolve(ROOT, 'stats.json'), 'utf8'));
const alts = {
  0: 'Janela de Terminal macOS com apresentação de Victor Hugo, tagline e comando whoami animado.',
  1: 'Botão de contato para o GitHub de Victor Hugo, VictorHNL.',
  2: 'Botão de contato para o LinkedIn de Victor Hugo.',
  3: 'Comando de terminal cat sobre.md.',
  4: 'Resumo sobre Victor Hugo, estudante de Sistemas de Informação com experiência prática em projetos acadêmicos e pessoais, estudando Java, Spring Boot, APIs RESTful e PostgreSQL.',
  5: 'Comando de terminal ls projetos.',
  6: 'Projeto em destaque PID 0001; descrição, linguagem e link para o repositório.',
  7: 'Projeto em destaque PID 0002; descrição, linguagem e link para o repositório.',
  8: 'Projeto em destaque PID 0003; descrição, linguagem e link para o repositório.',
  9: 'Comando de terminal neofetch.',
  10: 'Cartão neofetch com contribuições, streaks, repositórios, stars, forks, seguidores e linguagens.',
  11: 'Lista de atividade recente com os últimos commits públicos e repositórios atualizados.',
  12: 'Comando de terminal htop.',
  13: 'Ícones embutidos de Java, Spring Boot, APIs REST, PostgreSQL, Docker, Kubernetes, Scrum, microsserviços, Git e GitHub.',
  14: 'Comando de terminal contact --all.',
  15: 'Rodapé do Terminal com comando exit e data e hora da última atualização.',
};

let readme = await readFile(README, 'utf8');
readme = readme.replace(/!\[readme-aura-component-(\d+)\]\(([^\s)]+)([^)]*)\)/g, (match, index, url, suffix) => {
  const item = stats.projects?.[Number(index) - 6];
  const alt = item && Number(index) >= 6 && Number(index) <= 8
    ? `PID ${String(Number(index) - 5).padStart(4, '0')}: ${item.name}, ${item.description} Linguagem: ${item.language || 'não informada'}.`
    : (alts[index] || `Componente visual ${index} do perfil GitHub.`);
  return `![${alt}](${url}${suffix})`;
});
readme = readme.replace(/<img src="([^"]*readme-aura-component-(\d+)-[^" ]+\.svg)"([^>]*)\/>/g, (match, url, index, rest) => {
  if (/\balt=/.test(rest)) return match;
  const alt = alts[index] || `Componente visual ${index} do perfil GitHub.`;
  return `<img src="${url}"${rest} alt="${alt}" />`;
});
await writeFile(README, readme, 'utf8');
