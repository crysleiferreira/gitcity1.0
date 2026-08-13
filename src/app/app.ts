import {ChangeDetectionStrategy, Component, inject, signal, computed, ViewChild, OnInit} from '@angular/core';
import {ReactiveFormsModule, FormControl, Validators} from '@angular/forms';
import {Location, NgClass} from '@angular/common';
import {GithubService, GitHubRepo, GitHubUser} from './github.service';
import {CityComponent} from './city.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, CityComponent, NgClass],

  template: `
    <div class="min-h-screen md:h-screen w-full bg-[#0A0A0F] text-slate-200 flex flex-col overflow-x-hidden overflow-y-auto md:overflow-hidden font-sans selection:bg-cyan-500/30 relative">
      <nav class="flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-4 md:py-6 border-b border-white/5 bg-[#0D0D14] gap-4 md:gap-0 z-20">
        <div class="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
          <div class="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> </svg>
          </div>
          <h1 class="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">GitCity <span class="text-cyan-500 font-mono text-sm ml-2">v1.0</span></h1>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
          <div class="flex gap-2">
            <button (click)="showSettings.set(true)" class="p-2 rounded-lg border border-slate-700 hover:bg-white/5 transition-colors flex items-center justify-center text-slate-400 hover:text-white" title="Settings (API Token)">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button (click)="takeScreenshot()" class="p-2 rounded-lg border border-slate-700 hover:bg-white/5 transition-colors flex items-center justify-center text-slate-400 hover:text-white" title="Take Screenshot">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
            </button>
            <button (click)="toggleTimeOfDay()" class="p-2 rounded-lg border border-slate-700 hover:bg-white/5 transition-colors flex items-center justify-center text-slate-400 hover:text-white" title="Toggle Day/Night">
              @if (timeOfDay() === 'night') {
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              }
            </button>
          </div>
          <div class="flex gap-2 w-full md:w-auto">
            <div class="relative flex-1 md:flex-none">
              <input 
                type="text" 
                [formControl]="usernameCtrl"
                (keyup.enter)="generateCity()"
                placeholder="Enter GitHub Username..."
                class="bg-slate-900 border border-slate-700 rounded-lg py-2 pl-4 pr-12 w-full md:w-64 text-sm focus:outline-none focus:border-cyan-500 transition-all text-white placeholder-slate-500"
              />
              <div class="absolute right-2 top-1.5 px-2 py-0.5 bg-slate-800 rounded text-[10px] font-mono text-slate-400 hidden md:block">Enter</div>
            </div>
            <button 
              (click)="generateCity()"
              [disabled]="loading() || usernameCtrl.invalid"
              class="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 md:px-6 py-2 rounded-lg transition-colors flex items-center justify-center min-w-[100px] md:min-w-[140px] flex-none"
            >
            @if (loading()) {
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            } @else {
              Generate City
            }
            </button>
          </div>
        </div>
      </nav>

      <main class="flex-1 flex flex-col relative">
        <div class="flex-1 relative flex flex-col md:block transition-colors duration-1000"
             [ngClass]="timeOfDay() === 'night' ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black' : 'bg-sky-200'">
          <!-- Grid overlay -->
          <div class="absolute inset-0 opacity-20 pointer-events-none z-0" 
               [ngClass]="timeOfDay() === 'night' ? 'opacity-20' : 'opacity-10'"
               style="background-image: radial-gradient(#1e293b 1px, transparent 1px); background-size: 32px 32px;"></div>
          
          <!-- City Component -->
          <div class="relative md:absolute inset-0 z-10 flex flex-col flex-1 min-h-[60vh] md:min-h-0">
             <app-city [repos]="repos()" [timeOfDay]="timeOfDay()" class="flex-1 flex flex-col"></app-city>
          </div>

          <!-- Error State -->
          @if (error()) {
            <div class="absolute top-4 left-1/2 -translate-x-1/2 z-20 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 backdrop-blur-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-400 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
              <p class="text-sm text-red-200">{{ error() }}</p>
            </div>
          }

          <!-- Initial Empty State -->
          @if (repos().length === 0 && !loading() && !error()) {
            <div class="absolute inset-0 z-20 flex items-center justify-center pointer-events-none w-full md:w-[calc(100%-20rem)] p-4 text-center">
              <p class="text-slate-500 font-medium text-lg">Enter a username to generate the city.</p>
            </div>
          }

          <!-- User Stats Overlay (Bottom Left) -->
          @if (user() && !loading()) {
            <div class="relative md:absolute mt-4 md:mt-0 bottom-auto md:bottom-8 left-auto md:left-8 right-auto flex flex-col sm:flex-row gap-4 sm:gap-6 z-20 pointer-events-none px-4 md:px-0 mb-4 md:mb-0 shrink-0">
              <div class="bg-black/40 backdrop-blur-md border border-white/10 p-3 sm:p-4 rounded-xl flex items-center justify-between sm:justify-start gap-4 pointer-events-auto">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-cyan-500 shrink-0">
                    <img [src]="user()!.avatar_url" alt="profile" class="w-full h-full object-cover" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-[10px] sm:text-xs font-mono text-cyan-400">CURRENT PROFILE</p>
                    <p class="text-base sm:text-lg font-bold truncate max-w-[150px] sm:max-w-none">{{ user()!.name || user()!.login }}</p>
                  </div>
                </div>
              </div>
              
              <div class="bg-black/40 backdrop-blur-md border border-white/10 p-3 sm:p-4 rounded-xl flex justify-between sm:justify-start gap-4 sm:gap-8 pointer-events-auto">
                <div>
                  <p class="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 mb-0.5 sm:mb-1">Population</p>
                  <p class="text-lg sm:text-xl font-mono font-bold text-white">{{ user()!.public_repos }} <span class="text-[10px] sm:text-xs font-normal text-slate-500">repos</span></p>
                </div>
                <div>
                  <p class="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 mb-0.5 sm:mb-1">Total Stars</p>
                  <p class="text-lg sm:text-xl font-mono font-bold text-white">{{ totalStars() }} <span class="text-[10px] sm:text-xs font-normal text-slate-500">stars</span></p>
                </div>
                <div>
                  <p class="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 mb-0.5 sm:mb-1">Total Forks</p>
                  <p class="text-lg sm:text-xl font-mono font-bold text-white">{{ totalForks() }} <span class="text-[10px] sm:text-xs font-normal text-slate-500">forks</span></p>
                </div>
              </div>
            </div>
          }
        </div>
      </main>
      
      <footer class="px-4 md:px-8 py-3 bg-[#0A0A0F] border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-slate-500 uppercase tracking-widest z-30 gap-2 md:gap-0">
        <div>Render Mode: 3D City</div>
        <div>System Ready</div>
      </footer>

      <!-- Settings Modal -->
      @if (showSettings()) {
        <div class="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div class="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 class="text-xl font-bold text-white">Configurações</h2>
              <button (click)="showSettings.set(false)" class="text-slate-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div class="p-6">
              <label for="github-token" class="block text-sm font-medium text-slate-300 mb-2">GitHub Personal Access Token</label>
              <p class="text-xs text-slate-500 mb-4">
                Adicione um token (opcional) para aumentar o limite de buscas na API pública de 60 para 5.000 requisições por hora. 
                <br/><br/>
                O token é salvo de forma segura em um cookie HttpOnly e não é exposto ao navegador.
              </p>
              
              <input 
                id="github-token"
                type="password"
                [formControl]="tokenCtrl"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                class="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-cyan-500 transition-all text-white placeholder-slate-600 mb-6"
              />
              
              <div class="flex gap-3 justify-end">
                <button (click)="clearToken()" class="px-5 py-2 text-sm font-medium text-slate-400 hover:text-red-400 transition-colors">
                  Remover
                </button>
                <button (click)="saveToken()" class="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold px-6 py-2 rounded-lg transition-colors">
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class App implements OnInit {
  private github = inject(GithubService);
  private location = inject(Location);
  @ViewChild(CityComponent) cityComponent!: CityComponent;
  
  usernameCtrl = new FormControl('', [Validators.required]);
  tokenCtrl = new FormControl('');
  
  loading = signal(false);
  error = signal<string | null>(null);
  
  user = signal<GitHubUser | null>(null);
  repos = signal<GitHubRepo[]>([]);
  timeOfDay = signal<'day' | 'night'>('day');
  showSettings = signal(false);
  
  totalStars = computed(() => this.repos().reduce((sum, repo) => sum + repo.stargazers_count, 0));
  totalForks = computed(() => this.repos().reduce((sum, repo) => sum + repo.forks_count, 0));
  
  ngOnInit() {
    const path = this.location.path();
    if (path && path.length > 1) {
      const username = path.substring(1).split('/')[0];
      if (username) {
        this.usernameCtrl.setValue(username);
        // Defer generateCity to allow UI to render first if needed
        setTimeout(() => this.generateCity(), 0);
      }
    }
  }

  toggleTimeOfDay() {
    this.timeOfDay.set(this.timeOfDay() === 'night' ? 'day' : 'night');
  }

  takeScreenshot() {
    const user = this.user();
    if (!user) {
      this.cityComponent?.downloadScreenshot('city');
      return;
    }
    this.cityComponent?.downloadScreenshot(
      user.login,
      user.avatar_url,
      this.repos().length,
      this.totalStars(),
      this.totalForks()
    );
  }
  
  async saveToken() {
    const token = this.tokenCtrl.value?.trim();
    if (!token) return;
    try {
      await this.github.saveToken(token);
      this.showSettings.set(false);
      this.tokenCtrl.reset();
      // Optional: show toast message
    } catch (e) {
      console.error(e);
    }
  }

  async clearToken() {
    try {
      await this.github.saveToken('');
      this.showSettings.set(false);
      this.tokenCtrl.reset();
    } catch (e) {
      console.error(e);
    }
  }
  
  async generateCity() {
    if (this.usernameCtrl.invalid || this.loading()) return;
    
    const username = this.usernameCtrl.value!.trim();
    if (!username) return;
    
    const currentPath = this.location.path();
    if (currentPath !== `/${username}`) {
      this.location.go(`/${username}`);
    }
    
    this.loading.set(true);
    this.error.set(null);
    this.user.set(null);
    this.repos.set([]);
    
    try {
      const user = await this.github.getUser(username);
      this.user.set(user);
      
      const repos = await this.github.getRepos(username);
      this.repos.set(repos);
      
      if (repos.length === 0) {
        this.error.set('Este usuário não possui repositórios públicos.');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Ocorreu um erro ao buscar os dados.';
      this.error.set(errorMsg);
    } finally {
      this.loading.set(false);
    }
  }
}

