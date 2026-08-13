import {Injectable} from '@angular/core';

export interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  size: number;
  updated_at: string;
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
  public_repos: number;
}

@Injectable({
  providedIn: 'root'
})
export class GithubService {
  async getUser(username: string): Promise<GitHubUser> {
    const res = await fetch(`/api/github/users/${username}`);
    if (!res.ok) {
      if (res.status === 404) throw new Error('Usuário não encontrado.');
      if (res.status === 403) throw new Error('Limite de requisições da API excedido. Adicione um Token nas configurações para aumentar o limite.');
      if (res.status === 401) throw new Error('Token do GitHub inválido. Verifique suas configurações.');
      throw new Error(`Erro: ${res.statusText}`);
    }
    return res.json();
  }

  async getRepos(username: string): Promise<GitHubRepo[]> {
    let allRepos: GitHubRepo[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(`/api/github/users/${username}/repos?per_page=100&page=${page}&sort=pushed`);
      if (!res.ok) {
         if (res.status === 403) throw new Error('Limite de requisições da API excedido. Adicione um Token nas configurações para aumentar o limite.');
         if (res.status === 401) throw new Error('Token do GitHub inválido. Verifique suas configurações.');
         throw new Error(`Erro ao buscar repositórios: ${res.statusText}`);
      }
      const data: GitHubRepo[] = await res.json();
      allRepos = allRepos.concat(data);
      
      if (data.length < 100) {
        hasMore = false;
      } else {
        page++;
      }
      
      // Safety limit to avoid infinite loops or too many requests
      if (page > 3) hasMore = false; 
    }
    return allRepos;
  }
  
  async saveToken(token: string): Promise<void> {
    await fetch('/api/github/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
  }
}
