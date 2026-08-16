import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild, AfterViewInit, OnDestroy, signal } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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
        @if (isLoadingData || isGeneratingCity()) {
          <div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0D0D14]/90 backdrop-blur-sm text-white">
            <div class="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 class="text-xl font-bold tracking-widest uppercase text-cyan-400">Construindo Cidade...</h2>
            <p class="text-slate-400 text-sm mt-2">Carregando modelos 3D e renderizando quadras</p>
          </div>
        }
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
          <button (click)="generateMockCity()" class="mt-6 w-full py-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white text-xs font-bold uppercase tracking-wider rounded-lg">
             Build Mock City
          </button>
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
  @Input() isLoadingData: boolean = false;
  
  selectedRepo = signal<GitHubRepo | null>(null);
  capitalRepoId = signal<number>(-1);
  isGeneratingCity = signal<boolean>(false);

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private composer!: EffectComposer;
  private bloomPass!: UnrealBloomPass;
  private controls!: OrbitControls;
  private animationId?: number;
  
  // Shared Geometries for Performance Optimization
  private unitBox = new THREE.BoxGeometry(1, 1, 1);
  private unitBoxPivotBot = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  private unitBoxPivotZ = new THREE.BoxGeometry(1, 1, 1).translate(0, 0, 0.5);
  
  private ambientLight!: THREE.AmbientLight;
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private ground?: THREE.Mesh;
  private gridHelper?: THREE.GridHelper;
  
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  
  private buildings: THREE.Mesh[] = [];
  private buildingGroups: THREE.Object3D[] = [];
  private beacons: THREE.Mesh[] = [];
  private extraLights: THREE.Light[] = [];
  private clouds: THREE.Group[] = [];
  private windowMeshes: THREE.Mesh[] = [];
  
  private atlasTextures: THREE.Texture[] = [];
  private roadTexture: THREE.Texture | null = null;
  private textureLoader = new THREE.TextureLoader();

  private windowMap!: THREE.CanvasTexture;
  private windowEmissiveMap!: THREE.CanvasTexture;
  private buildingMats: THREE.MeshStandardMaterial[] = [];
  private streetLightMats: THREE.MeshBasicMaterial[] = [];
  private carLights: THREE.Mesh[] = [];
  private cars: { mesh: THREE.Object3D, dir: THREE.Vector3, speed: number }[] = [];
  private propsGroup = new THREE.Group();
  private antennas: { mat: THREE.MeshBasicMaterial }[] = [];
  private currentCitySize: number = 0;
  
  private blockModels: THREE.Object3D[] = [];
  private carModels: THREE.Object3D[] = [];
  private treeModels: THREE.Object3D[] = [];
  private rockModels: THREE.Object3D[] = [];
  private streetlightModel?: THREE.Object3D;
  private modelsLoaded = false;
  private isLoadingModels = false;
  
  private targetIsDay = true;
  private stars?: THREE.Points;

  private onWindowResizeBound = this.onWindowResize.bind(this);
  private onPointerDownBound = this.onPointerDown.bind(this);

  // Method to manually generate a mock city
  generateMockCity() {
    const mockRepos: GitHubRepo[] = [];
    const languages = ['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'HTML', 'Java', 'C#', 'Ruby'];
    
    // Generate 15 fake repos
    for (let i = 0; i < 15; i++) {
       const lang = languages[Math.floor(Math.random() * languages.length)];
       const stars = Math.floor(Math.random() * 500) + 10;
       
       mockRepos.push({
          id: 1000 + i,
          name: `mock-project-${i + 1}`,
          description: `This is a mock project generated for testing purposes. It is built with ${lang}.`,
          html_url: '#',
          stargazers_count: stars,
          forks_count: Math.floor(stars * 0.3),
          language: lang,
          size: Math.floor(Math.random() * 10000) + 500,
          updated_at: new Date().toISOString()
       });
    }
    
    this.repos = mockRepos;
    if (this.modelsLoaded) {
       this.buildCity();
    }
  }

  ngAfterViewInit() {
    this.initThreeJs();
    this.loadModels();
    this.animate();
    
    window.addEventListener('resize', this.onWindowResizeBound);
    this.canvasContainer.nativeElement.addEventListener('pointerdown', this.onPointerDownBound);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['repos'] && !changes['repos'].isFirstChange()) {
      if (this.modelsLoaded) {
         this.buildCity();
      } else {
         this.loadModels();
      }
    }
    if (changes['timeOfDay'] && !changes['timeOfDay'].isFirstChange()) {
      this.updateEnvironment();
    }
  }

  private async loadModels() {
    if (this.modelsLoaded || this.isLoadingModels) return;
    this.isLoadingModels = true;
    
    const loader = new GLTFLoader();
    
    const loadPromise = (path: string): Promise<THREE.Object3D | null> => {
        return new Promise((resolve) => {
            loader.load(path, (gltf) => resolve(gltf.scene), undefined, (err) => {
                console.warn(`Could not load ${path}`, err);
                resolve(null);
            });
        });
    };

    const buildingPaths = [
      '/quaternius_cc0-building-747.glb',
      '/quaternius_cc0-small-building-742.glb',
      '/quaternius_cc0-small-building-746.glb'
    ];
    
    const buildingScenes = await Promise.all(buildingPaths.map(p => loadPromise(p)));
    
    buildingScenes.forEach(scene => {
        if (scene) {
             scene.position.set(0, 0, 0);
             scene.rotation.set(0, 0, 0);
             scene.scale.set(1, 1, 1);
             const box = new THREE.Box3().setFromObject(scene);
             const size = new THREE.Vector3();
             box.getSize(size);
             const maxDim = Math.max(size.x, size.z);
             if (maxDim > 0.1) {
                 const scale = 15 / maxDim;
                 scene.scale.setScalar(scale);
             }
             this.blockModels.push(scene.clone());
        }
    });

    const streetlightScene = await loadPromise('/quaternius_cc0-streetlight-1394.glb');
    if (streetlightScene) {
        // scale it properly
        streetlightScene.scale.set(4, 4, 4); // Adjust as needed
        this.streetlightModel = streetlightScene;
    }
    
    const carFiles = [
        { path: '/carro.glb', targetSize: 2.5, isNightOnly: false },
        { path: '/carro_cartoon.glb', targetSize: 4.5, isNightOnly: true }
    ];
    for (const fileObj of carFiles) {
        const carScene = await loadPromise(fileObj.path);
        if (carScene) {
            const box = new THREE.Box3().setFromObject(carScene);
            const size = new THREE.Vector3();
            box.getSize(size);
            
            const center = new THREE.Vector3();
            box.getCenter(center);
            
            const clone = carScene.clone();
            // Center the car at 0,0,0 but keep its bottom at y=0
            clone.position.set(-center.x, -box.min.y, -center.z);
            
            const wrapper = new THREE.Group();
            wrapper.add(clone);
            wrapper.userData['isNightOnly'] = fileObj.isNightOnly;
            
            // Normalize scale so the car fits the road
            const maxDim = Math.max(size.x, size.z);
            if (maxDim > 0.1) {
                const scale = fileObj.targetSize / maxDim;
                wrapper.scale.setScalar(scale);
            }
            
            this.carModels.push(wrapper);
        }
    }

    const treeFiles = [
        { path: '/arvore_low-poly.glb', targetSize: 2.0 },
        { path: '/arvore_-_lowpoly_tree_cartoon.glb', targetSize: 3.5 }
    ];
    for (const fileObj of treeFiles) {
        const treeScene = await loadPromise(fileObj.path);
        if (treeScene) {
            const box = new THREE.Box3().setFromObject(treeScene);
            const size = new THREE.Vector3();
            box.getSize(size);
            
            const center = new THREE.Vector3();
            box.getCenter(center);
            
            const clone = treeScene.clone();
            // Center the tree at 0,0,0 but keep its bottom at y=0
            clone.position.set(-center.x, -box.min.y, -center.z);
            
            const wrapper = new THREE.Group();
            wrapper.add(clone);
            
            // Normalize scale
            const maxDim = Math.max(size.x, size.z);
            if (maxDim > 0.1) {
                const scale = fileObj.targetSize / maxDim;
                wrapper.scale.setScalar(scale);
            }
            
            this.treeModels.push(wrapper);
        }
    }

    const rockFiles = [
        { path: '/pedras.glb', targetSize: 3.5 }
    ];
    for (const fileObj of rockFiles) {
        const rockScene = await loadPromise(fileObj.path);
        if (rockScene) {
            const box = new THREE.Box3().setFromObject(rockScene);
            const size = new THREE.Vector3();
            box.getSize(size);
            
            const center = new THREE.Vector3();
            box.getCenter(center);
            
            const clone = rockScene.clone();
            clone.position.set(-center.x, -box.min.y, -center.z);
            
            const wrapper = new THREE.Group();
            wrapper.add(clone);
            
            const maxDim = Math.max(size.x, size.z);
            if (maxDim > 0.1) {
                const scale = fileObj.targetSize / maxDim;
                wrapper.scale.setScalar(scale);
            }
            
            this.rockModels.push(wrapper);
        }
    }

    this.modelsLoaded = true;
    this.isLoadingModels = false;
    this.buildCity();
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
    this.scene.background = new THREE.Color(0x7dd3fc); // matches sky-300
    this.scene.fog = new THREE.FogExp2(0x7dd3fc, 0.002);

    this.camera = new THREE.PerspectiveCamera(35, width / height, 1, 3000);
    this.camera.position.set(200, 200, 200);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    el.appendChild(this.renderer.domElement);

    // Environment map for reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    roomEnv.dispose();

    // Post-processing
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Removed bloomPass to prevent glow blowout
    // this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.15, 0.4, 0.85);
    // this.composer.addPass(this.bloomPass);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground
    this.controls.minDistance = 50;
    this.controls.maxDistance = 1000;

    // Lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
    this.hemiLight.position.set(0, 200, 0);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfffcf0, 0.65);
    this.dirLight.position.set(100, 200, 100);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 1500;
    // Bounds updated in buildCity dynamically
    this.scene.add(this.dirLight);
    
    this.createStars();
    this.createTextures();
    this.scene.add(this.propsGroup);
    
    this.updateEnvironment();
  }

  private createProceduralBuilding(width: number, height: number, colorHex: number, isCapital: boolean, repo: GitHubRepo): THREE.Group {
    const group = new THREE.Group();
    const isTall = height > 8;
    
    // Pick a random texture atlas for the building
    const sourceTex = this.atlasTextures.length > 0 
      ? this.atlasTextures[Math.floor(Math.random() * this.atlasTextures.length)] 
      : null;

    let buildingTex = null;
    if (sourceTex) {
      buildingTex = sourceTex.clone();
      buildingTex.wrapS = THREE.RepeatWrapping;
      buildingTex.wrapT = THREE.RepeatWrapping;
      // Calcula a repetição com base no tamanho da caixa para não esticar
      buildingTex.repeat.set(Math.max(1, width / 2), Math.max(1, height / 2));
      buildingTex.needsUpdate = true;
    }

    // Materials
    const baseMat = new THREE.MeshStandardMaterial({ 
      color: isTall ? colorHex : 0xaaaaaa, 
      map: buildingTex,
      roughness: 0.9, flatShading: true,
      emissive: isCapital ? new THREE.Color(colorHex) : new THREE.Color(0x000000),
      emissiveIntensity: isCapital ? 0.4 : 0
    }) as THREE.MeshStandardMaterial & { isCapital?: boolean };
    baseMat.isCapital = isCapital;
    this.buildingMats.push(baseMat);
    
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: isTall ? 0xdddddd : colorHex, 
      map: buildingTex,
      roughness: 0.9, flatShading: true,
    }) as THREE.MeshStandardMaterial & { isCapital?: boolean };
    bodyMat.isCapital = isCapital;
    this.buildingMats.push(bodyMat);

    const roofColor = new THREE.Color(isTall ? 0xaaaaaa : colorHex).multiplyScalar(0.85);
    const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, map: buildingTex, roughness: 1.0, flatShading: true });
    
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x1a1a24, roughness: 0.2, metalness: 0.8, flatShading: true });
    
    const baseH = isTall ? 4 : height;
    
    // Base block
    const baseMesh = new THREE.Mesh(this.unitBoxPivotBot, baseMat);
    baseMesh.scale.set(width, baseH, width);
    baseMesh.castShadow = true; baseMesh.receiveShadow = true;
    baseMesh.userData = { repo, isCapital };
    group.add(baseMesh);
    this.buildings.push(baseMesh); // Add for raycaster
    
    // Door
    const doorW = Math.min(1.5, width * 0.4); const doorH = Math.min(2.5, baseH * 0.8);
    const door = new THREE.Mesh(this.unitBoxPivotZ, windowMat);
    door.scale.set(doorW, doorH, 0.2);
    door.position.set(0, doorH/2, width/2);
    group.add(door);
    
    if (isTall) {
       const upperH = height - baseH;
       const upperMesh = new THREE.Mesh(this.unitBoxPivotBot, bodyMat);
       upperMesh.scale.set(width * 0.9, upperH, width * 0.9);
       upperMesh.position.set(0, baseH, 0);
       upperMesh.castShadow = true; upperMesh.receiveShadow = true;
       upperMesh.userData = { repo, isCapital };
       group.add(upperMesh);
       this.buildings.push(upperMesh);
       
       // Awning
       const awning = new THREE.Mesh(this.unitBox, new THREE.MeshStandardMaterial({ color: 0x888888, flatShading: true }));
       awning.scale.set(width + 0.4, 0.4, width + 0.4);
       awning.position.set(0, baseH, 0);
       awning.castShadow = true; awning.receiveShadow = true;
       group.add(awning);
       
       // Roof Parapet
       const parapetH = 0.6;
       const parapet = new THREE.Mesh(this.unitBoxPivotBot, baseMat);
       parapet.scale.set(width * 0.9, parapetH, width * 0.9);
       parapet.position.set(0, height, 0);
       parapet.castShadow = true;
       group.add(parapet);
       
       const roofIn = new THREE.Mesh(this.unitBoxPivotBot, roofMat);
       roofIn.scale.set(width * 0.8, parapetH + 0.1, width * 0.8);
       roofIn.position.set(0, height, 0);
       roofIn.receiveShadow = true;
       group.add(roofIn);
       
       // Windows
       const winW = 1.0; const winH = 1.2;
       const spacingX = 1.8; const spacingY = 2.4;
       const cols = Math.floor((width * 0.8) / spacingX);
       const floors = Math.floor((upperH - 1) / spacingY);
       
       if (cols > 0 && floors > 0) {
         for (let f = 0; f < floors; f++) {
            for (let c = 0; c < cols; c++) {
               const wx = (c - cols/2 + 0.5) * spacingX;
               const wy = baseH + 1.2 + f * spacingY + winH/2;
               
               const wF = new THREE.Mesh(this.unitBox, windowMat);
               wF.scale.set(winW, winH, 0.2);
               wF.position.set(wx, wy, width * 0.45);
               group.add(wF);
               this.windowMeshes.push(wF);
               
               const wB = new THREE.Mesh(this.unitBox, windowMat);
               wB.scale.set(winW, winH, 0.2);
               wB.position.set(wx, wy, -width * 0.45);
               group.add(wB);
               this.windowMeshes.push(wB);
            }
         }
       }
    } else {
       // Small shop
       // Awning
       // Select a bright color for shop awnings
       const shopColors = [0xef4444, 0xf59e0b, 0x10b981, 0x3b82f6, 0x8b5cf6];
       const awningColor = shopColors[(repo.size || 0) % shopColors.length];
       const awningMat = new THREE.MeshStandardMaterial({ color: awningColor, flatShading: true });
       const awning = new THREE.Mesh(this.unitBoxPivotZ, awningMat);
       awning.scale.set(width + 0.4, 0.3, width + 1.2);
       awning.position.set(0, height, -0.2);
       awning.castShadow = true; awning.receiveShadow = true;
       group.add(awning);
       
       // Sign
       const signMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true });
       const sign = new THREE.Mesh(this.unitBox, signMat);
       sign.scale.set(width - 1, 0.8, 0.2);
       sign.position.set(0, height + 0.4, width/2 + 0.05);
       group.add(sign);
       
       // Shop Window
       const shopWin = new THREE.Mesh(this.unitBox, windowMat);
       shopWin.scale.set(width - 1.5, Math.max(1, height - 1.5), 0.2);
       shopWin.position.set(0, (height - 1.5)/2 + 0.5, width/2 + 0.05);
       group.add(shopWin);
       this.windowMeshes.push(shopWin);
    }
    
    return group;
  }

  private updateEnvironment() {
    if (!this.scene) return;
    this.targetIsDay = this.timeOfDay === 'day';
    
    this.carLights.forEach(light => {
      light.visible = !this.targetIsDay;
    });

    this.cars.forEach(carObj => {
      if (carObj.mesh.userData['isNightOnly']) {
        carObj.mesh.visible = !this.targetIsDay;
      }
    });

    if (this.ground && this.repos && this.repos.length > 0) {
      const mat = this.ground.material as THREE.MeshStandardMaterial;
      if (mat.map) {
         mat.map.dispose();
         mat.map = null;
      }
      mat.color.setHex(this.targetIsDay ? 0x3a5f0b : 0x1a2e05);
      mat.needsUpdate = true;
    }
  }

  private buildCity() {
    if (!this.scene) return;
    this.isGeneratingCity.set(true);

    setTimeout(() => {
    // Clear old city
    this.buildings.forEach(b => {
      if (b.parent) b.parent.remove(b);
      this.disposeObject(b); // Be careful if reusing materials/geometries
    });
    this.buildingGroups.forEach(g => {
      this.scene.remove(g);
      this.disposeObject(g);
    });
    this.buildings = [];
    this.buildingGroups = [];
    
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
    
    this.clouds.forEach(c => {
      this.scene.remove(c);
      this.disposeObject(c);
    });
    this.clouds = [];
    this.windowMeshes = [];

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

    if (this.repos.length === 0) {
      this.isGeneratingCity.set(false);
      return;
    }

    const count = this.repos.length;
    
    // Distribute up to 4 buildings per block, leaving some empty slots for vegetation
    const averageBuildingsPerBlock = 2.5; 
    const numBlocks = Math.ceil(count / averageBuildingsPerBlock);
    const blockGridSize = Math.max(1, Math.ceil(Math.sqrt(numBlocks)));
    const blockSize = 24; // A single block is 24x24 units
    const citySize = blockGridSize * blockSize;
    this.currentCitySize = citySize;

    // Update Shadow Bounds
    const shadowSize = Math.max(100, citySize * 0.8);
    this.dirLight.shadow.camera.left = -shadowSize;
    this.dirLight.shadow.camera.right = shadowSize;
    this.dirLight.shadow.camera.top = shadowSize;
    this.dirLight.shadow.camera.bottom = -shadowSize;
    this.dirLight.shadow.camera.updateProjectionMatrix();

    // Ground
    const groundGeo = new THREE.PlaneGeometry(citySize * 1.5, citySize * 1.5);
    const groundMat = new THREE.MeshStandardMaterial({ 
      roughness: 0.9, 
      metalness: 0.05
    });
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.ground.name = 'ground';
    this.scene.add(this.ground);
    
    this.updateEnvironment(); // Will handle grid generation and syncing lights
    
    this.createClouds(citySize);

    const offset = (citySize - blockSize) / 2;

    // Generate building slots within the blocks
    const availableSlots: {bx: number, bz: number, sx: number, sz: number}[] = [];
    for(let bx = 0; bx < blockGridSize; bx++) {
       for(let bz = 0; bz < blockGridSize; bz++) {
          availableSlots.push({bx, bz, sx: -1, sz: -1});
          availableSlots.push({bx, bz, sx: 1, sz: -1});
          availableSlots.push({bx, bz, sx: -1, sz: 1});
          availableSlots.push({bx, bz, sx: 1, sz: 1});
       }
    }
    
    // Shuffle slots
    for(let i = availableSlots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableSlots[i], availableSlots[j]] = [availableSlots[j], availableSlots[i]];
    }

    const usedSlots = new Set<string>();

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
      if (i >= availableSlots.length) return; // safety fallback
      const slot = availableSlots[i];
      usedSlots.add(`${slot.bx},${slot.bz},${slot.sx},${slot.sz}`);

      // Base width based on size
      const minWidth = 3.5;
      const maxWidth = 7.5;
      // log scale for size to avoid giant buildings
      const sizeFactor = Math.log10(repo.size + 1) / Math.log10(100000 + 1); 
      let width = minWidth + (maxWidth - minWidth) * Math.min(sizeFactor, 1);
      width = Math.min(width, 7.5);

      // Height based on stars + forks
      const minHeight = 4;
      const maxHeight = 60;
      const popularity = repo.stargazers_count + repo.forks_count * 2;
      const heightFactor = Math.sqrt(popularity) / Math.sqrt(10000); // 10k max ref
      const height = minHeight + (maxHeight - minHeight) * Math.min(heightFactor, 1);

      // Color based on language
      const colorHex = repo.language && LANGUAGE_COLORS[repo.language] 
        ? LANGUAGE_COLORS[repo.language] 
        : DEFAULT_COLOR;

      const isCapital = repo.id === this.capitalRepoId();

      let buildingGroup: THREE.Object3D;
      let modelHeight = height;

      if (this.blockModels.length > 0) {
          const randIdx = Math.floor(Math.random() * this.blockModels.length);
          buildingGroup = this.blockModels[randIdx].clone();
          
          // Calculate current size of the cloned group
          const box = new THREE.Box3().setFromObject(buildingGroup);
          const size = new THREE.Vector3();
          box.getSize(size);
          
          buildingGroup.traverse((child) => {
             if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.userData = { repo, isCapital };
                this.buildings.push(mesh);
             }
          });
          
          // Scale uniformly to prevent window deformation
          if (size.x > 0.1 && size.y > 0.1 && size.z > 0.1) {
              const uniformScale = width / Math.max(size.x, size.z);
              buildingGroup.scale.set(
                  buildingGroup.scale.x * uniformScale,
                  buildingGroup.scale.y * uniformScale,
                  buildingGroup.scale.z * uniformScale
              );
              modelHeight = size.y * uniformScale;
          }
      } else {
          buildingGroup = this.createProceduralBuilding(width, height, colorHex, isCapital, repo);
      }

      const slotOffsetX = slot.sx * 4.5; // push 4.5 units from center of block
      const slotOffsetZ = slot.sz * 4.5;
      
      const posX = slot.bx * blockSize - offset + slotOffsetX;
      const posZ = slot.bz * blockSize - offset + slotOffsetZ;

      buildingGroup.position.set(posX, 0, posZ);
      this.buildingGroups.push(buildingGroup);
      this.scene.add(buildingGroup);

      if (isCapital) {
        // Add floating beacon
        const beaconSize = Math.max(width * 0.3, 1.5);
        const beaconGeo = new THREE.OctahedronGeometry(beaconSize);
        const beaconMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: colorHex,
          emissiveIntensity: 2,
          wireframe: false
        });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        const baseY = modelHeight + beaconSize * 1.5;
        beacon.position.set(posX, baseY, posZ);
        beacon.userData = { repo, baseY, isBeacon: true };
        
        this.scene.add(beacon);
        this.beacons.push(beacon);
        this.buildings.push(beacon); // Allow raycaster to pick up the beacon too
        
        // Add dynamic light
        const light = new THREE.PointLight(colorHex, 100, citySize);
        light.position.set(posX, baseY, posZ);
        this.scene.add(light);
        this.extraLights.push(light);
      }
      
      if (Math.random() > 0.7 && modelHeight > 15 && !isCapital) {
        const antH = 2 + Math.random() * 4;
        const antGeo = new THREE.CylinderGeometry(0.1, 0.1, antH);
        const antMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const ant = new THREE.Mesh(antGeo, antMat);
        ant.position.set(0, modelHeight + antH/2, 0);
        buildingGroup.add(ant);
        
        const lightGeo = new THREE.SphereGeometry(0.3);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const lightMesh = new THREE.Mesh(lightGeo, lightMat);
        lightMesh.position.set(0, modelHeight + antH, 0);
        buildingGroup.add(lightMesh);
        
        this.antennas.push({ mat: lightMat });
      }
    });

    this.createPropsAndCars(blockGridSize, citySize, blockSize, availableSlots, usedSlots);

    // Center camera
    this.controls.target.set(0, 0, 0);
    const camDist = Math.max(120, citySize * 1.4);
    this.camera.position.set(camDist, camDist, camDist);
    this.controls.update();
    
    this.isGeneratingCity.set(false);
    }, 50);
  }

  private animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    this.controls.update();
    
    // Lerp Environment
    if (this.scene) {
      const fog = this.scene.fog as THREE.FogExp2;
      const targetFogColor = this.targetIsDay ? new THREE.Color(0x7dd3fc) : new THREE.Color(0x0f172a);
      const targetFogDensity = this.targetIsDay ? 0.002 : 0.0035;
      
      fog.color.lerp(targetFogColor, 0.02);
      fog.density += (targetFogDensity - fog.density) * 0.02;
      (this.scene.background as THREE.Color).lerp(targetFogColor, 0.02);
      
      this.ambientLight.intensity += ( (this.targetIsDay ? 0.3 : 0.1) - this.ambientLight.intensity) * 0.02;
      
      this.hemiLight.intensity += ( (this.targetIsDay ? 0.4 : 0.2) - this.hemiLight.intensity) * 0.02;
      this.hemiLight.color.lerp(this.targetIsDay ? new THREE.Color(0xffffff) : new THREE.Color(0x333344), 0.02);
      this.hemiLight.groundColor.lerp(this.targetIsDay ? new THREE.Color(0x444444) : new THREE.Color(0x0a0a0f), 0.02);
      
      this.dirLight.intensity += ( (this.targetIsDay ? 0.65 : 0.25) - this.dirLight.intensity) * 0.02;
      this.dirLight.color.lerp(this.targetIsDay ? new THREE.Color(0xfffcf0) : new THREE.Color(0xa5b4fc), 0.02);
      
      // Update bloom
      if (this.bloomPass) {
        const targetBloomStrength = this.targetIsDay ? 0.05 : 0.4;
        this.bloomPass.strength += (targetBloomStrength - this.bloomPass.strength) * 0.05;
      }
      
      const targetEmissive = this.targetIsDay ? 0 : 0.6;
      this.buildingMats.forEach(mat => {
        if (!(mat as THREE.MeshStandardMaterial & { isCapital?: boolean }).isCapital) {
          mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.02;
        }
      });
      
      const windowEmissive = this.targetIsDay ? 0 : 0.9;
      const windowColor = this.targetIsDay ? new THREE.Color(0x000000) : new THREE.Color(0xffeeba);
      this.windowMeshes.forEach(w => {
         const m = w.material as THREE.MeshStandardMaterial;
         m.emissiveIntensity += (windowEmissive - m.emissiveIntensity) * 0.02;
         m.emissive.lerp(windowColor, 0.02);
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
    
    this.clouds.forEach(cloud => {
      cloud.position.x += 0.04;
      if (cloud.userData['maxX'] && cloud.position.x > cloud.userData['maxX']) {
        cloud.position.x = cloud.userData['minX'];
      }
    });
    
    const halfCity = this.currentCitySize / 2;
    this.cars.forEach(car => {
      car.mesh.position.addScaledVector(car.dir, car.speed);
      
      if (car.dir.x !== 0) {
        if (car.mesh.position.x > halfCity) car.mesh.position.x = -halfCity;
        if (car.mesh.position.x < -halfCity) car.mesh.position.x = halfCity;
      }
      if (car.dir.z !== 0) {
        if (car.mesh.position.z > halfCity) car.mesh.position.z = -halfCity;
        if (car.mesh.position.z < -halfCity) car.mesh.position.z = halfCity;
      }
    });

    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private onWindowResize() {
    if (!this.canvasContainer || !this.camera || !this.renderer) return;
    const el = this.canvasContainer.nativeElement;
    this.camera.aspect = el.clientWidth / el.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(el.clientWidth, el.clientHeight);
    if (this.composer) {
       this.composer.setSize(el.clientWidth, el.clientHeight);
    }
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
    
    // Base grass color
    ctx.fillStyle = isDay ? '#86efac' : '#064e3b';
    ctx.fillRect(0, 0, res, res);
    
    // Road color
    ctx.fillStyle = isDay ? '#64748b' : '#0f172a';
    
    for (let i = 0; i <= gridSize; i++) {
      const pos = i * blockSize;
      ctx.fillRect(pos - roadWidth/2, 0, roadWidth, res);
      ctx.fillRect(0, pos - roadWidth/2, res, roadWidth);
    }
    
    // Road Markings (Dashed lines)
    ctx.strokeStyle = isDay ? '#cbd5e1' : '#475569';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    for (let i = 0; i <= gridSize; i++) {
      const pos = i * blockSize;
      ctx.moveTo(pos, 0); ctx.lineTo(pos, res);
      ctx.moveTo(0, pos); ctx.lineTo(res, pos);
    }
    ctx.stroke();
    
    // Crosswalks at intersections
    ctx.fillStyle = isDay ? '#e2e8f0' : '#334155';
    const cwSize = roadWidth * 0.8;
    const stripeW = 2;
    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const px = i * blockSize;
        const py = j * blockSize;
        // Simple square in intersection to act as crosswalk zone
        ctx.fillRect(px - cwSize/2, py - cwSize/2, cwSize, cwSize);
        // Inner road color block to make it look like stripes
        ctx.fillStyle = isDay ? '#64748b' : '#0f172a';
        ctx.fillRect(px - cwSize/2 + stripeW, py - cwSize/2 + stripeW, cwSize - stripeW*2, cwSize - stripeW*2);
        ctx.fillStyle = isDay ? '#e2e8f0' : '#334155';
      }
    }
    
    // Sidewalks
    const sidewalkWidth = blockSize * 0.06;
    ctx.fillStyle = isDay ? '#cbd5e1' : '#1e293b';
    for (let i = 0; i <= gridSize; i++) {
      const pos = i * blockSize;
      // Vertical sidewalks
      ctx.fillRect(pos - roadWidth/2 - sidewalkWidth, 0, sidewalkWidth, res);
      ctx.fillRect(pos + roadWidth/2, 0, sidewalkWidth, res);
      // Horizontal sidewalks
      ctx.fillRect(0, pos - roadWidth/2 - sidewalkWidth, res, sidewalkWidth);
      ctx.fillRect(0, pos + roadWidth/2, res, sidewalkWidth);
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    if (this.renderer) {
      tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    }
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  private createClouds(citySize: number) {
    const cloudGeo = new THREE.SphereGeometry(1, 7, 7);
    const cloudMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, 
      flatShading: true,
      roughness: 1.0 
    });
    
    for (let i=0; i<Math.max(10, citySize/15); i++) {
       const cloud = new THREE.Group();
       const numPuffs = 3 + Math.floor(Math.random() * 4);
       for (let j=0; j<numPuffs; j++) {
          const puff = new THREE.Mesh(cloudGeo, cloudMat);
          const s = 3 + Math.random() * 4;
          puff.scale.set(s, s, s);
          puff.position.set(
             (Math.random() - 0.5) * 6,
             (Math.random() - 0.5) * 3,
             (Math.random() - 0.5) * 6
          );
          puff.castShadow = true;
          puff.receiveShadow = true;
          cloud.add(puff);
       }
       cloud.position.set(
          (Math.random() - 0.5) * citySize * 2,
          40 + Math.random() * 30,
          (Math.random() - 0.5) * citySize * 2
       );
       cloud.userData = { 
         minX: -citySize * 1.5,
         maxX: citySize * 1.5
       };
       this.scene.add(cloud);
       this.clouds.push(cloud);
    }
  }

  private createPropsAndCars(blockGridSize: number, citySize: number, blockSize: number, availableSlots: {bx: number, bz: number, sx: number, sz: number}[], usedSlots: Set<string>) {
    const offset = (citySize - blockSize) / 2;
    const roadPositions: number[] = [];
    // Roads are positioned between the blocks
    for (let i = 0; i <= blockGridSize; i++) {
       roadPositions.push(i * blockSize - offset - blockSize / 2);
    }
    
    // Draw Roads (gray planes) and Sidewalks (lighter grey planes)
    const roadWidth = blockSize * 0.20; // 4.8 width
    const sidewalkWidth = blockSize * 0.32; // 7.68 width (includes road)
    
    const roadGeo = new THREE.PlaneGeometry(citySize + sidewalkWidth, roadWidth);
    const sidewalkGeo = new THREE.PlaneGeometry(citySize + sidewalkWidth, sidewalkWidth);
    
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 });
    
    // Horizontal roads & sidewalks
    roadPositions.forEach(rz => {
       const sidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
       sidewalk.rotation.x = -Math.PI / 2;
       sidewalk.position.set(0, 0.04, rz);
       sidewalk.receiveShadow = true;
       this.propsGroup.add(sidewalk);

       const road = new THREE.Mesh(roadGeo, roadMat);
       road.rotation.x = -Math.PI / 2;
       road.position.set(0, 0.05, rz);
       road.receiveShadow = true;
       this.propsGroup.add(road);
    });
    
    // Vertical roads & sidewalks
    const roadGeoV = new THREE.PlaneGeometry(roadWidth, citySize + sidewalkWidth);
    const sidewalkGeoV = new THREE.PlaneGeometry(sidewalkWidth, citySize + sidewalkWidth);
    
    roadPositions.forEach(rx => {
       const sidewalk = new THREE.Mesh(sidewalkGeoV, sidewalkMat);
       sidewalk.rotation.x = -Math.PI / 2;
       sidewalk.position.set(rx, 0.04, 0);
       sidewalk.receiveShadow = true;
       this.propsGroup.add(sidewalk);

       const road = new THREE.Mesh(roadGeoV, roadMat);
       road.rotation.x = -Math.PI / 2;
       road.position.set(rx, 0.05, 0);
       road.receiveShadow = true;
       this.propsGroup.add(road);
    });
    
    // Pine Trees
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 1.0, flatShading: true });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 1.0, flatShading: true });
    const trunkGeo = new THREE.BoxGeometry(0.3, 1.0, 0.3);
    const l1Geo = new THREE.ConeGeometry(1.2, 2.0, 4);
    const l2Geo = new THREE.ConeGeometry(1.0, 1.8, 4);
    const l3Geo = new THREE.ConeGeometry(0.8, 1.6, 4);

    // Helper to generate a tree
    const generateTree = (x: number, z: number) => {
       let group: THREE.Object3D;
       if (this.treeModels.length > 0) {
           const randIdx = Math.floor(Math.random() * this.treeModels.length);
           group = this.treeModels[randIdx].clone();
           // Small variation in rotation
           group.rotation.y = Math.random() * Math.PI * 2;
       } else {
           group = new THREE.Group();
           const trunk = new THREE.Mesh(trunkGeo, trunkMat);
           trunk.position.y = 0.5;
           trunk.castShadow = true; trunk.receiveShadow = true;
           
           const l1 = new THREE.Mesh(l1Geo, leafMat);
           l1.position.y = 1.5; l1.castShadow = true; l1.receiveShadow = true;
           const l2 = new THREE.Mesh(l2Geo, leafMat);
           l2.position.y = 2.5; l2.castShadow = true; l2.receiveShadow = true;
           const l3 = new THREE.Mesh(l3Geo, leafMat);
           l3.position.y = 3.5; l3.castShadow = true; l3.receiveShadow = true;
           
           group.add(trunk, l1, l2, l3);
       }
       
       group.position.set(x, 0, z);
       const s = 0.5 + Math.random() * 0.5;
       group.scale.set(group.scale.x * s, group.scale.y * s, group.scale.z * s);
       this.propsGroup.add(group);
    };

    // Fill unused slots heavily with trees, and sparse trees randomly in used slots
    availableSlots.forEach(slot => {
       const isUsed = usedSlots.has(`${slot.bx},${slot.bz},${slot.sx},${slot.sz}`);
       const slotOffsetX = slot.sx * 4.5; 
       const slotOffsetZ = slot.sz * 4.5;
       
       const blockCenterX = slot.bx * blockSize - offset;
       const blockCenterZ = slot.bz * blockSize - offset;
       const posX = blockCenterX + slotOffsetX;
       const posZ = blockCenterZ + slotOffsetZ;
       
       const limit = 7.5; // Stay well clear of the road/sidewalk

       if (!isUsed) {
          // Create dense vegetation in empty slot
          for (let k = 0; k < 6; k++) {
             let tx = posX + (Math.random() - 0.5) * 6;
             let tz = posZ + (Math.random() - 0.5) * 6;
             tx = Math.max(blockCenterX - limit, Math.min(blockCenterX + limit, tx));
             tz = Math.max(blockCenterZ - limit, Math.min(blockCenterZ + limit, tz));
             generateTree(tx, tz);
          }
       } else {
          // Maybe one random tree around the building
          if (Math.random() > 0.5) {
             const angle = Math.random() * Math.PI * 2;
             const dist = 4.5 + Math.random() * 1.5; // push it outside the max building radius
             let tx = posX + Math.cos(angle) * dist;
             let tz = posZ + Math.sin(angle) * dist;
             tx = Math.max(blockCenterX - limit, Math.min(blockCenterX + limit, tx));
             tz = Math.max(blockCenterZ - limit, Math.min(blockCenterZ + limit, tz));
             generateTree(tx, tz);
          }
       }
    });
    
    // Streetlights
    const poleGeo = new THREE.BoxGeometry(0.15, 3, 0.15);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, flatShading: true });
    const bulbGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    
    const spawnStreetlight = (x: number, z: number, rotationY: number = 0) => {
        let wrapper = new THREE.Group();
        
        const bulbMat = new THREE.MeshBasicMaterial({ color: this.timeOfDay === 'night' ? 0xffdd44 : 0x94a3b8 });
        
        if (this.streetlightModel) {
            const model = this.streetlightModel.clone();
            // find the Light mesh and replace its material
            model.traverse((child) => {
                if ((child as THREE.Mesh).isMesh && child.name.toLowerCase().includes('light')) {
                    (child as THREE.Mesh).material = bulbMat;
                }
            });
            // compute bounding box to ensure it rests at y=0
            const box = new THREE.Box3().setFromObject(model);
            model.position.y = -box.min.y;
            wrapper.add(model);
        } else {
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.y = 1.5;
            const bulb = new THREE.Mesh(bulbGeo, bulbMat);
            bulb.position.y = 3;
            wrapper.add(pole, bulb);
        }
        
        wrapper.position.set(x, 0, z);
        wrapper.rotation.y = rotationY;
        this.propsGroup.add(wrapper);
        this.streetLightMats.push(bulbMat);
    };

    // Distribute streetlights along the roads, skipping intersections
    roadPositions.forEach(rz => {
        // Horizontal road
        for(let rx = -offset; rx <= offset; rx += blockSize / 2) {
            let inIntersection = false;
            for (let vRx of roadPositions) {
               if (Math.abs(rx - vRx) < roadWidth) { inIntersection = true; break; }
            }
            if (inIntersection) continue;
            
            spawnStreetlight(rx, rz + sidewalkWidth/2 - 0.5, Math.PI); // faces -Z
            spawnStreetlight(rx + blockSize/4, rz - sidewalkWidth/2 + 0.5, 0); // faces +Z
        }
    });
    
    roadPositions.forEach(rx => {
        // Vertical road
        for(let rz = -offset; rz <= offset; rz += blockSize / 2) {
            let inIntersection = false;
            for (let hRz of roadPositions) {
               if (Math.abs(rz - hRz) < roadWidth) { inIntersection = true; break; }
            }
            if (inIntersection) continue;
            
            spawnStreetlight(rx + sidewalkWidth/2 - 0.5, rz, Math.PI / 2); // faces -X
            spawnStreetlight(rx - sidewalkWidth/2 + 0.5, rz + blockSize/4, -Math.PI / 2); // faces +X
        }
    });

    // Add Crosswalks (Faixa de pedestre) and Center Dashed Lines
    const stripeGeo = new THREE.PlaneGeometry(0.3, roadWidth - 0.4);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, depthWrite: false });
    
    const createCrosswalk = (x: number, z: number, isHorizontal: boolean) => {
        const group = new THREE.Group();
        for(let i = -1.5; i <= 1.5; i += 0.6) {
           const stripe = new THREE.Mesh(stripeGeo, stripeMat);
           stripe.rotation.x = -Math.PI / 2;
           if (isHorizontal) {
               stripe.position.set(i, 0.052, 0);
           } else {
               stripe.rotation.z = Math.PI / 2;
               stripe.position.set(0, 0.052, i);
           }
           group.add(stripe);
        }
        group.position.set(x, 0, z);
        this.propsGroup.add(group);
    };

    const dashGeo = new THREE.PlaneGeometry(1.2, 0.15);
    const dashMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, depthWrite: false });
    
    roadPositions.forEach(rx => {
       roadPositions.forEach(rz => {
           // Create crosswalks slightly offset from the exact center of intersection
           createCrosswalk(rx - roadWidth/2 - 1.2, rz, true); // left side of intersection
           createCrosswalk(rx + roadWidth/2 + 1.2, rz, true); // right side
           createCrosswalk(rx, rz - roadWidth/2 - 1.2, false); // top side
           createCrosswalk(rx, rz + roadWidth/2 + 1.2, false); // bottom side
       });
    });

    // Add dashed lines
    roadPositions.forEach(rz => {
        for(let x = -citySize/2; x < citySize/2; x += 3) {
            let inIntersection = false;
            for (let rx of roadPositions) {
                if (Math.abs(x - rx) < roadWidth) { inIntersection = true; break; }
            }
            if (!inIntersection) {
                const dash = new THREE.Mesh(dashGeo, dashMat);
                dash.rotation.x = -Math.PI / 2;
                dash.position.set(x, 0.052, rz);
                this.propsGroup.add(dash);
            }
        }
    });
    roadPositions.forEach(rx => {
        for(let z = -citySize/2; z < citySize/2; z += 3) {
            let inIntersection = false;
            for (let rz of roadPositions) {
                if (Math.abs(z - rz) < roadWidth) { inIntersection = true; break; }
            }
            if (!inIntersection) {
                const dash = new THREE.Mesh(dashGeo, dashMat);
                dash.rotation.x = -Math.PI / 2;
                dash.rotation.z = Math.PI / 2;
                dash.position.set(rx, 0.052, z);
                this.propsGroup.add(dash);
            }
        }
    });
    
    // Stylized Low-poly Cars
    const carGroupGeo = new THREE.BoxGeometry(1.2, 0.4, 2.2);
    const carTopGeo = new THREE.BoxGeometry(1.0, 0.5, 1.2);
    const hlGeo = new THREE.BoxGeometry(0.25, 0.2, 0.1);
    const wheelGeo = new THREE.BoxGeometry(0.3, 0.4, 0.4);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, flatShading: true });
    
    for (let i = 0; i < blockGridSize * 3; i++) {
       let car: THREE.Object3D;
       if (this.carModels.length > 0) {
           const randIdx = Math.floor(Math.random() * this.carModels.length);
           car = this.carModels[randIdx].clone();
       } else {
           const carMat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff, roughness: 0.6, flatShading: true });
           car = new THREE.Group();
           const body = new THREE.Mesh(carGroupGeo, carMat);
           body.position.y = 0.4;
           body.castShadow = true; body.receiveShadow = true;
           
           const topMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, flatShading: true });
           const top = new THREE.Mesh(carTopGeo, topMat);
           top.position.set(0, 0.85, -0.2);
           top.castShadow = true; top.receiveShadow = true;
           
           const w1 = new THREE.Mesh(wheelGeo, wheelMat); w1.position.set(0.65, 0.2, 0.7);
           const w2 = new THREE.Mesh(wheelGeo, wheelMat); w2.position.set(-0.65, 0.2, 0.7);
           const w3 = new THREE.Mesh(wheelGeo, wheelMat); w3.position.set(0.65, 0.2, -0.7);
           const w4 = new THREE.Mesh(wheelGeo, wheelMat); w4.position.set(-0.65, 0.2, -0.7);
           
           car.add(body, top, w1, w2, w3, w4);
       }
       
       const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
       const tlMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
       
       const hl1 = new THREE.Mesh(hlGeo, hlMat); hl1.position.set(-0.4, 0.4, 1.1);
       const hl2 = new THREE.Mesh(hlGeo, hlMat); hl2.position.set(0.4, 0.4, 1.1);
       const tl1 = new THREE.Mesh(hlGeo, tlMat); tl1.position.set(-0.4, 0.4, -1.1);
       const tl2 = new THREE.Mesh(hlGeo, tlMat); tl2.position.set(0.4, 0.4, -1.1);
       
       hl1.visible = hl2.visible = tl1.visible = tl2.visible = (this.timeOfDay === 'night');
       
       car.add(hl1, hl2, tl1, tl2);
       this.carLights.push(hl1, hl2, tl1, tl2);
       
       const isHorizontal = Math.random() > 0.5;
       const roadPos = roadPositions[Math.floor(Math.random() * roadPositions.length)];
       const posAlong = (Math.random() - 0.5) * citySize;
       
       const dir = new THREE.Vector3();
       if (isHorizontal) {
          const moveRight = Math.random() > 0.5;
          car.position.set(posAlong, 0, roadPos + (moveRight ? 1.2 : -1.2));
          dir.set(moveRight ? 1 : -1, 0, 0);
          car.rotation.y = moveRight ? Math.PI / 2 : -Math.PI / 2;
       } else {
          const moveDown = Math.random() > 0.5;
          car.position.set(roadPos + (moveDown ? -1.2 : 1.2), 0, posAlong);
          dir.set(0, 0, moveDown ? 1 : -1);
          car.rotation.y = moveDown ? 0 : Math.PI;
       }
       
       if (car.userData['isNightOnly']) {
          car.visible = (this.timeOfDay === 'night');
       }
       
       this.propsGroup.add(car);
       this.cars.push({ mesh: car, dir, speed: 0.04 + Math.random() * 0.04 });
    }
    
    // Scatter Rocks around the edges of the city
    if (this.rockModels.length > 0) {
       const boundaryInner = citySize / 2 + 6;
       const boundaryOuter = citySize * 0.75 - 4; // Keep them within the ground plane
       const numRocks = Math.floor(citySize * 1.5); // Density based on city size
       
       for (let i = 0; i < numRocks; i++) {
           // Decide which edge to put the rock on (0=Top, 1=Right, 2=Bottom, 3=Left)
           const edge = Math.floor(Math.random() * 4);
           let rx = 0, rz = 0;
           const range = boundaryOuter - boundaryInner;
           let alongEdge = (Math.random() - 0.5) * 2 * boundaryOuter;
           
           // Avoid roads (so rocks don't block the end of the streets)
           let nearRoad = false;
           for (const rp of roadPositions) {
               if (Math.abs(alongEdge - rp) < (roadWidth / 2 + 5)) {
                   nearRoad = true;
                   break;
               }
           }
           if (nearRoad) continue;

           const depth = boundaryInner + Math.random() * range;
           
           if (edge === 0) { rx = alongEdge; rz = -depth; }
           else if (edge === 1) { rx = depth; rz = alongEdge; }
           else if (edge === 2) { rx = alongEdge; rz = depth; }
           else { rx = -depth; rz = alongEdge; }
           
           const randIdx = Math.floor(Math.random() * this.rockModels.length);
           const rock = this.rockModels[randIdx].clone();
           rock.position.set(rx, 0, rz);
           rock.rotation.y = Math.random() * Math.PI * 2;
           const s = 0.5 + Math.random() * 1.5;
           rock.scale.set(rock.scale.x * s, rock.scale.y * s, rock.scale.z * s);
           this.propsGroup.add(rock);
       }
    }
  }

  private disposeObject(obj: THREE.Object3D) {
    obj.traverse(child => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry && 
            child.geometry !== this.unitBox && 
            child.geometry !== this.unitBoxPivotBot && 
            child.geometry !== this.unitBoxPivotZ) {
          child.geometry.dispose();
        }
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      }
    });
  }
}
