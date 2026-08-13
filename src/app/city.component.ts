import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild, AfterViewInit, OnDestroy, signal } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GitHubRepo } from './github.service';

const LANGUAGE_COLORS: Record<string, number> = {
  JavaScript: 0xf1e05a,
  TypeScript: 0x3178c6,
  Python: 0x3572A5,
  Java: 0xb07219,
  'C#': 0x178600,
  Ruby: 0x701516,
  PHP: 0x4F5D95,
  'C++': 0xf34b7d,
  C: 0x555555,
  Go: 0x00ADD8,
  Rust: 0xdea584,
  HTML: 0xe34c26,
  CSS: 0x563d7c,
  Shell: 0x89e051,
  Swift: 0xF05138,
  Kotlin: 0xA97BFF,
  Dart: 0x00B4AB,
  Vue: 0x41b883,
  Svelte: 0xff3e00,
};
const DEFAULT_COLOR = 0x94a3b8;

@Component({
  selector: 'app-city',
  template: `
    <div class="relative w-full flex-1 flex flex-col md:flex-row overflow-hidden">
      <div class="flex-1 relative order-2 md:order-1 min-h-[40vh] md:min-h-0">
        <div #canvasContainer class="w-full h-full absolute inset-0 bg-transparent cursor-crosshair"></div>
      </div>
      
      <aside class="w-full md:w-80 bg-[#0D0D14] border-b md:border-b-0 md:border-l border-white/5 p-4 md:p-6 flex flex-col gap-4 md:gap-6 z-20 shrink-0 overflow-y-auto order-1 md:order-2 max-h-[35vh] md:max-h-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div class="flex-none w-full">
          <h3 class="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2 md:mb-4">Structure Details</h3>
          
          @if (selectedRepo()) {
            <div class="bg-slate-900/50 rounded-xl p-3 md:p-5 border border-white/5 relative">
              <button (click)="closeModal()" class="absolute top-2 right-2 md:top-4 md:right-4 text-slate-500 hover:text-white transition-colors cursor-pointer p-1">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
              
              <div class="flex justify-between items-start mb-2 md:mb-4">
                <span class="px-2 py-0.5 text-[9px] md:text-[10px] font-bold rounded uppercase" 
                      [style.color]="getLanguageColorStr(selectedRepo()!.language)" 
                      [style.backgroundColor]="getLanguageBgStr(selectedRepo()!.language)">
                  {{ selectedRepo()!.language || 'Unknown' }}
                </span>
              </div>
              <h4 class="text-sm md:text-lg font-bold text-white mb-1 break-words pr-6">
                {{ selectedRepo()!.name }}
                @if (selectedRepo()!.id === capitalRepoId()) {
                  <span class="ml-2 inline-flex items-center rounded-md bg-yellow-400/10 px-1.5 py-0.5 text-[8px] md:text-[10px] font-bold text-yellow-500 ring-1 ring-inset ring-yellow-400/20 uppercase tracking-widest relative -top-0.5">👑 Capital</span>
                }
              </h4>
              <p class="text-[11px] md:text-sm text-slate-400 leading-relaxed mb-2 md:mb-4 line-clamp-2 md:line-clamp-4">
                {{ selectedRepo()!.description || 'Sem descrição.' }}
              </p>
              
              <div class="grid grid-cols-2 gap-2 md:gap-4 pt-2 md:pt-4 border-t border-white/5">
                <div>
                  <p class="text-[8px] md:text-[10px] text-slate-500 uppercase font-bold">Stars</p>
                  <p class="text-sm md:text-lg font-mono text-white">{{ selectedRepo()!.stargazers_count }}</p>
                </div>
                <div>
                  <p class="text-[8px] md:text-[10px] text-slate-500 uppercase font-bold">Forks</p>
                  <p class="text-sm md:text-lg font-mono text-white">{{ selectedRepo()!.forks_count }}</p>
                </div>
              </div>
              
              <a [href]="selectedRepo()!.html_url" target="_blank" rel="noopener noreferrer" class="mt-3 md:mt-6 block w-full text-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 md:py-3 text-xs md:text-sm font-semibold transition-all text-white cursor-pointer">
                Open Source Repository
              </a>
            </div>
          } @else {
            <div class="bg-slate-900/30 rounded-xl p-4 md:p-5 border border-white/5 border-dashed flex items-center justify-center text-center h-[80px] md:h-48">
              <p class="text-[10px] md:text-sm text-slate-500">Select a building in the city to view repository details.</p>
            </div>
          }
        </div>

        <div class="flex-none w-full">
          <h3 class="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2 md:mb-4">Map Legend</h3>
          <div class="flex flex-wrap gap-x-4 gap-y-2 md:block md:space-y-3">
            <div class="flex items-center gap-1.5 md:gap-3">
              <div class="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#f1e05a]"></div>
              <span class="text-[10px] md:text-sm text-slate-400">JavaScript / TS</span>
            </div>
            <div class="flex items-center gap-1.5 md:gap-3">
              <div class="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#3572A5]"></div>
              <span class="text-[10px] md:text-sm text-slate-400">Python / Java</span>
            </div>
            <div class="flex items-center gap-1.5 md:gap-3">
              <div class="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#dea584]"></div>
              <span class="text-[10px] md:text-sm text-slate-400">Rust / C#</span>
            </div>
            <div class="flex items-center gap-1.5 md:gap-3">
              <div class="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#e34c26]"></div>
              <span class="text-[10px] md:text-sm text-slate-400">HTML / CSS</span>
            </div>
            <div class="flex items-center gap-1.5 md:gap-3">
              <div class="w-2 h-2 md:w-3 md:h-3 rounded-full bg-slate-500"></div>
              <span class="text-[10px] md:text-sm text-slate-400">Other</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  `,
  standalone: true
})
export class CityComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLDivElement>;
  @Input() repos: GitHubRepo[] = [];
  @Input() timeOfDay: 'day' | 'night' = 'day';
  
  selectedRepo = signal<GitHubRepo | null>(null);
  capitalRepoId = signal<number>(-1);

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private animationId?: number;
  
  private ambientLight!: THREE.AmbientLight;
  private dirLight!: THREE.DirectionalLight;
  private fillLight!: THREE.DirectionalLight;
  private ground?: THREE.Mesh;
  private gridHelper?: THREE.GridHelper;
  
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  
  private buildings: THREE.Mesh[] = [];
  private beacons: THREE.Mesh[] = [];
  private extraLights: THREE.Light[] = [];
  
  private windowMap!: THREE.CanvasTexture;
  private windowEmissiveMap!: THREE.CanvasTexture;
  private buildingMats: THREE.MeshStandardMaterial[] = [];
  private streetLightMats: THREE.MeshBasicMaterial[] = [];
  private carLights: THREE.Mesh[] = [];
  private cars: { mesh: THREE.Group, dir: THREE.Vector3, speed: number }[] = [];
  private propsGroup = new THREE.Group();
  private antennas: { mat: THREE.MeshBasicMaterial }[] = [];
  
  private targetIsDay = true;
  private stars?: THREE.Points;

  private onWindowResizeBound = this.onWindowResize.bind(this);
  private onPointerDownBound = this.onPointerDown.bind(this);

  ngAfterViewInit() {
    this.initThreeJs();
    this.buildCity();
    this.animate();
    
    window.addEventListener('resize', this.onWindowResizeBound);
    this.canvasContainer.nativeElement.addEventListener('pointerdown', this.onPointerDownBound);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['repos']) {
      this.buildCity();
    }
    if (changes['timeOfDay']) {
      this.updateEnvironment();
    }
  }

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onWindowResizeBound);
    if (this.canvasContainer) {
      this.canvasContainer.nativeElement.removeEventListener('pointerdown', this.onPointerDownBound);
    }
    
    // Dispose resources
    if (this.renderer) this.renderer.dispose();
    if (this.controls) this.controls.dispose();
  }

  public async downloadScreenshot(
    username: string,
    avatarUrl?: string,
    reposCount = 0,
    totalStars = 0,
    totalForks = 0
  ) {
    if (!this.renderer || !this.scene || !this.camera) return;
    
    // Ensure the scene is fully rendered
    this.renderer.render(this.scene, this.camera);
    
    const webglCanvas = this.renderer.domElement;
    
    // Create a composite canvas
    const canvas = document.createElement('canvas');
    canvas.width = webglCanvas.width;
    canvas.height = webglCanvas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw 3D scene
    ctx.drawImage(webglCanvas, 0, 0);
    
    // Draw UI overlay if we have a user
    if (username !== 'city') {
      const scale = window.devicePixelRatio || 1; // webgl canvas is scaled
      
      const pW = 420 * scale;
      const pH = 110 * scale;
      const padding = 32 * scale;
      const x = padding;
      const y = canvas.height - pH - padding;
      
      // Panel
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(x, y, pW, pH, 16 * scale);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2 * scale;
      ctx.stroke();

      // Watermark
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = `bold ${20 * scale}px monospace`;
      ctx.textAlign = 'right';
      ctx.fillText('GitCity', canvas.width - padding, padding + (20 * scale));
      ctx.textAlign = 'left';
      
      // Avatar
      if (avatarUrl) {
        try {
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image();
            i.crossOrigin = 'anonymous';
            i.onload = () => resolve(i);
            i.onerror = reject;
            i.src = avatarUrl;
          });
          ctx.save();
          ctx.beginPath();
          ctx.arc(x + (55 * scale), y + (55 * scale), 30 * scale, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, x + (25 * scale), y + (25 * scale), 60 * scale, 60 * scale);
          ctx.restore();
        } catch (e) {
          console.warn('Failed to load avatar', e);
        }
      }
      
      // Text
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${24 * scale}px sans-serif`;
      ctx.fillText(`@${username}`, x + (100 * scale), y + (48 * scale));
      
      ctx.fillStyle = '#94a3b8';
      ctx.font = `${16 * scale}px sans-serif`;
      ctx.fillText(`Population: ${reposCount}  |  Stars: ${totalStars}  |  Forks: ${totalForks}`, x + (100 * scale), y + (80 * scale));
    }
    
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `gitcity-${username}-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  }

  private initThreeJs() {
    const el = this.canvasContainer.nativeElement;
    const width = el.clientWidth;
    const height = el.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbae6fd);
    this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.0015);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 1, 2000);
    this.camera.position.set(100, 100, 150);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    el.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground
    this.controls.minDistance = 20;
    this.controls.maxDistance = 500;

    // Lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xfffcf0, 1.5);
    this.dirLight.position.set(100, 200, 50);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 500;
    this.dirLight.shadow.camera.left = -200;
    this.dirLight.shadow.camera.right = 200;
    this.dirLight.shadow.camera.top = 200;
    this.dirLight.shadow.camera.bottom = -200;
    this.scene.add(this.dirLight);
    
    this.fillLight = new THREE.DirectionalLight(0xbae6fd, 0.6); // Cool fill light
    this.fillLight.position.set(-100, 100, -50);
    this.scene.add(this.fillLight);
    
    this.createStars();
    this.createTextures();
    this.scene.add(this.propsGroup);
    
    this.updateEnvironment();
  }

  private updateEnvironment() {
    if (!this.scene) return;
    this.targetIsDay = this.timeOfDay === 'day';
    
    this.carLights.forEach(light => {
      light.visible = !this.targetIsDay;
    });

    // Ground and Grid Texture
    if (this.ground && this.repos && this.repos.length > 0) {
      const gridSize = Math.ceil(Math.sqrt(this.repos.length));
      const mat = this.ground.material as THREE.MeshStandardMaterial;
      if (mat.map) mat.map.dispose();
      mat.map = this.getGroundTexture(gridSize, this.targetIsDay);
      mat.color.setHex(0xffffff);
      mat.needsUpdate = true;
    }
  }

  private buildCity() {
    if (!this.scene) return;
    
    // Clear old city
    this.buildings.forEach(b => {
      this.scene.remove(b);
      (b.geometry as THREE.BufferGeometry).dispose();
      if (Array.isArray(b.material)) {
        b.material.forEach(m => m.dispose());
      } else {
        (b.material as THREE.Material).dispose();
      }
    });
    this.buildings = [];
    
    this.beacons.forEach(b => {
      this.scene.remove(b);
      (b.geometry as THREE.BufferGeometry).dispose();
      (b.material as THREE.Material).dispose();
    });
    this.beacons = [];
    
    this.extraLights.forEach(l => {
      this.scene.remove(l);
      if (l instanceof THREE.PointLight) l.dispose();
    });
    this.extraLights = [];
    
    this.buildingMats.forEach(m => m.dispose());
    this.buildingMats = [];
    this.streetLightMats.forEach(m => m.dispose());
    this.streetLightMats = [];
    this.carLights = [];
    this.cars = [];
    this.antennas = [];
    
    while(this.propsGroup.children.length > 0) {
      const child = this.propsGroup.children[0];
      this.propsGroup.remove(child);
      this.disposeObject(child);
    }
    
    if (this.ground) {
      this.scene.remove(this.ground);
      if ((this.ground.material as THREE.MeshStandardMaterial).map) {
        (this.ground.material as THREE.MeshStandardMaterial).map!.dispose();
      }
      (this.ground.material as THREE.Material).dispose();
      this.ground.geometry.dispose();
      this.ground = undefined;
    }

    const existingGround = this.scene.getObjectByName('ground');
    if (existingGround) {
      this.scene.remove(existingGround);
      this.disposeObject(existingGround);
    }

    if (this.repos.length === 0) return;

    const count = this.repos.length;
    const gridSize = Math.ceil(Math.sqrt(count));
    const spacing = 20;
    const citySize = gridSize * spacing;

    // Ground
    const groundGeo = new THREE.PlaneGeometry(citySize, citySize);
    const groundMat = new THREE.MeshStandardMaterial({ 
      roughness: 0.8,
      metalness: 0.2
    });
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.ground.name = 'ground';
    this.scene.add(this.ground);
    
    this.updateEnvironment(); // Will handle grid generation and syncing lights
    
    this.createPropsAndCars(gridSize, citySize);

    const offset = (citySize - spacing) / 2;

    let capId = -1;
    if (this.repos.length > 0) {
      const sorted = [...this.repos].sort((a, b) => b.stargazers_count - a.stargazers_count);
      if (sorted[0].stargazers_count > 0) {
        capId = sorted[0].id;
      } else {
        capId = this.repos[0].id; // Fallback to first if all have 0 stars
      }
    }
    this.capitalRepoId.set(capId);

    this.repos.forEach((repo, i) => {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;

      // Base width based on size
      const minWidth = 4;
      const maxWidth = 16;
      // log scale for size to avoid giant buildings
      const sizeFactor = Math.log10(repo.size + 1) / Math.log10(100000 + 1); 
      const width = minWidth + (maxWidth - minWidth) * Math.min(sizeFactor, 1);

      // Height based on stars + forks
      const minHeight = 5;
      const maxHeight = 100;
      const popularity = repo.stargazers_count + repo.forks_count * 2;
      const heightFactor = Math.sqrt(popularity) / Math.sqrt(10000); // 10k max ref
      const height = minHeight + (maxHeight - minHeight) * Math.min(heightFactor, 1);

      // Color based on language
      const colorHex = repo.language && LANGUAGE_COLORS[repo.language] 
        ? LANGUAGE_COLORS[repo.language] 
        : DEFAULT_COLOR;

      const isCapital = repo.id === this.capitalRepoId();

      const geometry = new THREE.BoxGeometry(width, height, width);
      // Move pivot to bottom
      geometry.translate(0, height / 2, 0);

      const texMap = this.windowMap.clone();
      texMap.repeat.set(Math.max(1, Math.round(width/6)), Math.max(1, Math.round(height/6)));
      const texEmissive = this.windowEmissiveMap.clone();
      texEmissive.repeat.set(Math.max(1, Math.round(width/6)), Math.max(1, Math.round(height/6)));
      
      const material = new THREE.MeshStandardMaterial({ 
        color: colorHex,
        map: texMap,
        emissiveMap: texEmissive,
        emissive: isCapital ? new THREE.Color(colorHex) : new THREE.Color(0xffffff),
        emissiveIntensity: isCapital ? 0.3 : (this.timeOfDay === 'night' ? 1 : 0),
        roughness: isCapital ? 0.2 : 0.8,
        metalness: isCapital ? 0.8 : 0.1,
      }) as THREE.MeshStandardMaterial & { isCapital?: boolean };
      material.isCapital = isCapital;
      this.buildingMats.push(material);

      const matTop = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: isCapital ? new THREE.Color(colorHex) : new THREE.Color(0x000000),
        emissiveIntensity: isCapital ? 0.3 : 0,
        roughness: isCapital ? 0.2 : 0.8,
        metalness: isCapital ? 0.8 : 0.1,
      });
      this.buildingMats.push(matTop);

      const materials = [material, material, matTop, matTop, material, material];
      const mesh = new THREE.Mesh(geometry, materials);
      mesh.position.set(col * spacing - offset, 0, row * spacing - offset);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      // Store repo data in userData for raycaster
      mesh.userData = { repo, isCapital };
      
      this.buildings.push(mesh);
      this.scene.add(mesh);

      if (isCapital) {
        // Add floating beacon
        const beaconSize = Math.max(width * 0.6, 6);
        const beaconGeo = new THREE.OctahedronGeometry(beaconSize);
        const beaconMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: colorHex,
          emissiveIntensity: 2,
          wireframe: false
        });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        const baseY = height + beaconSize * 1.5;
        beacon.position.set(col * spacing - offset, baseY, row * spacing - offset);
        beacon.userData = { repo, baseY, isBeacon: true };
        
        this.scene.add(beacon);
        this.beacons.push(beacon);
        this.buildings.push(beacon); // Allow raycaster to pick up the beacon too
        
        // Add dynamic light
        const light = new THREE.PointLight(colorHex, 150, citySize);
        light.position.set(col * spacing - offset, baseY, row * spacing - offset);
        this.scene.add(light);
        this.extraLights.push(light);
      }
      
      if (Math.random() > 0.7 && height > 15 && !isCapital) {
        const antH = 2 + Math.random() * 4;
        const antGeo = new THREE.CylinderGeometry(0.1, 0.1, antH);
        const antMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const ant = new THREE.Mesh(antGeo, antMat);
        ant.position.set(col * spacing - offset, height + antH/2, row * spacing - offset);
        this.scene.add(ant);
        this.buildings.push(ant);
        
        const lightGeo = new THREE.SphereGeometry(0.3);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const lightMesh = new THREE.Mesh(lightGeo, lightMat);
        lightMesh.position.set(col * spacing - offset, height + antH, row * spacing - offset);
        this.scene.add(lightMesh);
        this.buildings.push(lightMesh);
        
        this.antennas.push({ mat: lightMat });
      }
    });

    // Center camera
    this.controls.target.set(0, 0, 0);
    this.camera.position.set(citySize * 0.8, citySize * 0.5, citySize * 0.8);
    this.controls.update();
  }

  private animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    this.controls.update();
    
    // Lerp Environment
    if (this.scene) {
      const fog = this.scene.fog as THREE.FogExp2;
      const targetFogColor = this.targetIsDay ? new THREE.Color(0xbae6fd) : new THREE.Color(0x0A0A0F);
      const targetFogDensity = this.targetIsDay ? 0.0015 : 0.0035;
      
      fog.color.lerp(targetFogColor, 0.02);
      fog.density += (targetFogDensity - fog.density) * 0.02;
      (this.scene.background as THREE.Color).lerp(targetFogColor, 0.02);
      
      this.ambientLight.intensity += ( (this.targetIsDay ? 0.85 : 0.4) - this.ambientLight.intensity) * 0.02;
      
      this.dirLight.intensity += ( (this.targetIsDay ? 1.5 : 0.8) - this.dirLight.intensity) * 0.02;
      this.dirLight.color.lerp(this.targetIsDay ? new THREE.Color(0xfffcf0) : new THREE.Color(0xffffff), 0.02);
      
      this.fillLight.intensity += ( (this.targetIsDay ? 0.6 : 0.3) - this.fillLight.intensity) * 0.02;
      this.fillLight.color.lerp(this.targetIsDay ? new THREE.Color(0xbae6fd) : new THREE.Color(0xa5b4fc), 0.02);
      
      const targetEmissive = this.targetIsDay ? 0 : 1;
      this.buildingMats.forEach(mat => {
        if (!(mat as THREE.MeshStandardMaterial & { isCapital?: boolean }).isCapital) {
          mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.02;
        }
      });
      
      const targetStreetLight = this.targetIsDay ? new THREE.Color(0x94a3b8) : new THREE.Color(0xffdd44);
      this.streetLightMats.forEach(mat => {
        mat.color.lerp(targetStreetLight, 0.02);
      });
      
      if (this.stars) {
        const targetOpacity = this.targetIsDay ? 0 : 0.8;
        const mat = this.stars.material as THREE.PointsMaterial;
        mat.opacity += (targetOpacity - mat.opacity) * 0.02;
        this.stars.rotation.y += 0.0005;
      }
    }
    
    const blink = (Date.now() % 2000 < 1000) && !this.targetIsDay;
    this.antennas.forEach(a => {
        a.mat.color.setHex(blink ? 0xff0000 : 0x220000);
    });
    
    const time = Date.now() * 0.002;
    this.beacons.forEach(beacon => {
      beacon.rotation.y += 0.02;
      beacon.rotation.z += 0.01;
      if (beacon.userData['baseY']) {
        beacon.position.y = beacon.userData['baseY'] + Math.sin(time) * 3;
      }
    });
    
    const halfCity = (Math.ceil(Math.sqrt(this.repos.length)) * 20) / 2;
    this.cars.forEach(car => {
      car.mesh.position.addScaledVector(car.dir, car.speed);
      if (car.mesh.position.x > halfCity) car.mesh.position.x = -halfCity;
      if (car.mesh.position.x < -halfCity) car.mesh.position.x = halfCity;
      if (car.mesh.position.z > halfCity) car.mesh.position.z = -halfCity;
      if (car.mesh.position.z < -halfCity) car.mesh.position.z = halfCity;
    });

    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize() {
    if (!this.canvasContainer || !this.camera || !this.renderer) return;
    const el = this.canvasContainer.nativeElement;
    this.camera.aspect = el.clientWidth / el.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(el.clientWidth, el.clientHeight);
  }

  private onPointerDown(event: PointerEvent) {
    if (!this.canvasContainer) return;
    
    const el = this.canvasContainer.nativeElement;
    const rect = el.getBoundingClientRect();
    
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    this.mouse.x = ((event.clientX - rect.left) / el.clientWidth) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / el.clientHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check intersection with buildings
    const intersects = this.raycaster.intersectObjects(this.buildings);

    if (intersects.length > 0) {
      // Get the first intersected building
      const object = intersects[0].object;
      const repo = object.userData['repo'] as GitHubRepo;
      if (repo) {
        this.selectedRepo.set(repo);
      }
    } else {
      // Clicked outside any building
      this.selectedRepo.set(null);
    }
  }
  
  closeModal() {
    this.selectedRepo.set(null);
  }
  
  getLanguageColorStr(lang: string | null): string {
    if (!lang) return '#94a3b8';
    const hex = LANGUAGE_COLORS[lang] || DEFAULT_COLOR;
    return '#' + hex.toString(16).padStart(6, '0');
  }

  getLanguageBgStr(lang: string | null): string {
    if (!lang) return '#94a3b833';
    const hex = LANGUAGE_COLORS[lang] || DEFAULT_COLOR;
    return '#' + hex.toString(16).padStart(6, '0') + '33';
  }

  private createStars() {
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 2000;
    const posArray = new Float32Array(starsCount * 3);
    for(let i=0; i<starsCount*3; i++) {
       posArray[i] = (Math.random() - 0.5) * 1000;
       // push stars slightly up so they don't clip floor as much
       if (i % 3 === 1) posArray[i] = Math.abs(posArray[i]); 
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const starsMat = new THREE.PointsMaterial({ size: 1.5, color: 0xffffff, transparent: true, opacity: 0 });
    this.stars = new THREE.Points(starsGeo, starsMat);
    this.scene.add(this.stars);
  }

  private createTextures() {
    // Window map
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#0f172a';
    for (let x=0; x<3; x++) {
        for (let y=0; y<3; y++) {
            ctx.fillRect(x*85 + 20, y*85 + 20, 45, 45);
        }
    }
    this.windowMap = new THREE.CanvasTexture(canvas);
    this.windowMap.wrapS = this.windowMap.wrapT = THREE.RepeatWrapping;

    // Emissive map
    const can2 = document.createElement('canvas');
    can2.width = 256; can2.height = 256;
    const ctx2 = can2.getContext('2d')!;
    ctx2.fillStyle = '#000000';
    ctx2.fillRect(0, 0, 256, 256);
    ctx2.fillStyle = '#fbbf24';
    for (let x=0; x<3; x++) {
        for (let y=0; y<3; y++) {
            if (Math.random() < 0.4) {
                ctx2.fillRect(x*85 + 20, y*85 + 20, 45, 45);
            }
        }
    }
    this.windowEmissiveMap = new THREE.CanvasTexture(can2);
    this.windowEmissiveMap.wrapS = this.windowEmissiveMap.wrapT = THREE.RepeatWrapping;
  }

  private getGroundTexture(gridSize: number, isDay: boolean): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    const res = 1024;
    canvas.width = res; canvas.height = res;
    const ctx = canvas.getContext('2d')!;
    
    const blockSize = res / gridSize;
    const roadWidthRatio = 0.25;
    const roadWidth = blockSize * roadWidthRatio;
    
    ctx.fillStyle = isDay ? '#cbd5e1' : '#1e293b';
    ctx.fillRect(0, 0, res, res);
    
    ctx.fillStyle = isDay ? '#94a3b8' : '#0f172a';
    
    for (let i = 0; i <= gridSize; i++) {
      const pos = i * blockSize;
      ctx.fillRect(pos - roadWidth/2, 0, roadWidth, res);
      ctx.fillRect(0, pos - roadWidth/2, res, roadWidth);
    }
    
    ctx.fillStyle = isDay ? '#86efac' : '#064e3b';
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
         if (Math.random() > 0.5) {
           const pad = roadWidth;
           ctx.fillRect(i*blockSize + pad, j*blockSize + pad, blockSize - pad*2, blockSize - pad*2);
         }
      }
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  private createPropsAndCars(gridSize: number, citySize: number) {
    const offset = citySize / 2;
    const roadPositions: number[] = [];
    for (let i = 0; i <= gridSize; i++) {
       roadPositions.push(i * 20 - offset);
    }
    
    // Trees
    const treeGeo = new THREE.ConeGeometry(0.8, 2, 4);
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.2, 1);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03 });
    
    for(let i=0; i<gridSize*3; i++) {
       const group = new THREE.Group();
       const leaves = new THREE.Mesh(treeGeo, treeMat);
       leaves.position.y = 1.5;
       const trunk = new THREE.Mesh(trunkGeo, trunkMat);
       trunk.position.y = 0.5;
       group.add(leaves, trunk);
       
       const cellX = Math.floor(Math.random() * gridSize);
       const cellZ = Math.floor(Math.random() * gridSize);
       const x = cellX * 20 - offset + 10 + (Math.random() - 0.5) * 10;
       const z = cellZ * 20 - offset + 10 + (Math.random() - 0.5) * 10;
       group.position.set(x, 0, z);
       this.propsGroup.add(group);
    }
    
    // Streetlights
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 3);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const bulbGeo = new THREE.SphereGeometry(0.3);
    
    roadPositions.forEach((rx, ix) => {
       roadPositions.forEach((rz, iz) => {
          const group = new THREE.Group();
          const pole = new THREE.Mesh(poleGeo, poleMat);
          pole.position.y = 1.5;
          
          const bulbMat = new THREE.MeshBasicMaterial({ color: this.timeOfDay === 'night' ? 0xffdd44 : 0x94a3b8 });
          const bulb = new THREE.Mesh(bulbGeo, bulbMat);
          bulb.position.y = 3;
          
          group.add(pole, bulb);
          
          // Move slightly away from intersection center
          const dirX = ix === 0 ? 1 : -1;
          const dirZ = iz === 0 ? 1 : -1;
          group.position.set(rx + dirX * 3, 0, rz + dirZ * 3);
          
          this.propsGroup.add(group);
          this.streetLightMats.push(bulbMat);
       });
    });
    
    // Cars
    const carGeo = new THREE.BoxGeometry(0.8, 0.5, 1.8);
    const hlGeo = new THREE.BoxGeometry(0.2, 0.2, 0.1);
    
    for (let i = 0; i < gridSize * 2; i++) {
       const carMat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff, roughness: 0.3, metalness: 0.6 });
       const car = new THREE.Group();
       const body = new THREE.Mesh(carGeo, carMat);
       body.position.y = 0.25;
       car.add(body);
       
       const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
       const tlMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
       
       const hl1 = new THREE.Mesh(hlGeo, hlMat); hl1.position.set(-0.3, 0.25, 0.9);
       const hl2 = new THREE.Mesh(hlGeo, hlMat); hl2.position.set(0.3, 0.25, 0.9);
       const tl1 = new THREE.Mesh(hlGeo, tlMat); tl1.position.set(-0.3, 0.25, -0.9);
       const tl2 = new THREE.Mesh(hlGeo, tlMat); tl2.position.set(0.3, 0.25, -0.9);
       
       hl1.visible = hl2.visible = tl1.visible = tl2.visible = (this.timeOfDay === 'night');
       
       car.add(hl1, hl2, tl1, tl2);
       this.carLights.push(hl1, hl2, tl1, tl2);
       
       const isHorizontal = Math.random() > 0.5;
       const roadPos = roadPositions[Math.floor(Math.random() * roadPositions.length)];
       const posAlong = (Math.random() - 0.5) * citySize;
       
       const dir = new THREE.Vector3();
       if (isHorizontal) {
          const moveRight = Math.random() > 0.5;
          car.position.set(posAlong, 0, roadPos + (moveRight ? 1.5 : -1.5));
          dir.set(moveRight ? 1 : -1, 0, 0);
          car.rotation.y = moveRight ? Math.PI / 2 : -Math.PI / 2;
       } else {
          const moveDown = Math.random() > 0.5;
          car.position.set(roadPos + (moveDown ? 1.5 : -1.5), 0, posAlong);
          dir.set(0, 0, moveDown ? 1 : -1);
          car.rotation.y = moveDown ? 0 : Math.PI;
       }
       
       this.propsGroup.add(car);
       this.cars.push({ mesh: car, dir, speed: 0.1 + Math.random() * 0.1 });
    }
  }

  private disposeObject(obj: THREE.Object3D) {
    obj.traverse(child => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      }
    });
  }
}
