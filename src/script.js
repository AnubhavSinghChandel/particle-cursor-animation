import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import particlesVertexShader from './shaders/particles/vertex.glsl'
import particlesFragmentShader from './shaders/particles/fragment.glsl'
import { Pane } from 'tweakpane'
import Stats from 'stats.js';

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loaders
const textureLoader = new THREE.TextureLoader()

// GUI
const debugActive = window.location.hash === "#debug"
const gui = new Pane()
const stats = new Stats()

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Materials
    particles.particlesMaterial.uniforms.uResolution.value.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 0, 18)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setClearColor('#181818')
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)

/**
 * Textures
 */

const textures = [
    '/GodzillaPOP.png',
    '/jett-2.jpg',
    '/jett.jpg',
    '/PACMAN.jpeg',
    '/picture-1.png',
    '/picture-2.png',
    '/picture-3.png',
    '/picture-4.png',
]

// loading image as texture
const loadTexture = async (textureRoute) => {
    // I hate JS, most counterintuitive language.
    // Could have just loaded the texture and
    // accessed the width and height inside the onLoad function 
    // and set it to an object if this language allowed it.
    // Apparantly the texture properties are only accessible inside the onLoad function 
    // and if you try assigning it to an object or a variable, guess what you CAN'T
    // IF I CAN ACCESS THE DATA SOMEWHERE AND I ASSIGN IT TO ANYTHING JUST GIVE ME THE DATA, WHAT DO YOU MEAN "it's not loaded yet"
    const texture = await textureLoader.loadAsync(textureRoute)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
}

// This WILL NOT BUILD if building with VITE
// because old browsers don't support top level await calls 
// check vite config for fix.
// all this BS for the async crap
const loadedTexture = await loadTexture(textures[0])
const loadedTextureProps = {}
if (loadedTexture) {
    loadedTextureProps.width = loadedTexture.image.width
    loadedTextureProps.height = loadedTexture.image.height
}

/**
 * Displacement
 */
const displacement = {}

// 2D Canvas
displacement.canvas = document.createElement('canvas')


if (debugActive) {
    document.body.append(displacement.canvas)
    document.body.appendChild(stats.dom);
}

// Particles object
const particles = {}

// easiest solution I could think of when disposing off and creating new Material
particles.size = 0.5

const createInteractivePlane = (texture, textureProps) => {

    // disposing of previous plane
    if (Object.keys(particles).length > 1) {
        scene.remove(particles.particlesMesh)
        particles.particlesGeometry.dispose()
        particles.particlesMaterial.dispose()
        scene.remove(displacement.interactivePlane)
        displacement.interactivePlane.geometry.dispose()
        displacement.interactivePlane.material.dispose()
    }

    //Logic to set plane Geometry dimensions according to image dimensions
    const baseHeight = 9
    const aspect = textureProps.width / textureProps.height
    const planeWidth = baseHeight * aspect
    const planeHeight = baseHeight
    const planeSegment = aspect < 16 / 9 ? 256 : 512

    // console.log(planeWidth, planeHeight);

    // 2D Canvas
    // canvas width and height (pixel amount) should be proportional to aspect ratio
    displacement.canvas.width = aspect < 16 / 9 ? 128 : 256
    displacement.canvas.height = 128
    displacement.canvas.style.position = 'fixed'
    // displacement.canvas.style.width = '256px'
    // displacement.canvas.style.height = '256px'
    displacement.canvas.style.left = '100px'
    displacement.canvas.style.right = 0
    displacement.canvas.style.zIndex = 10

    /**
     * Interactive Plane
     */
    displacement.interactivePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(planeWidth, planeHeight),
        new THREE.MeshBasicMaterial({
            color: '#ff0000',
            wireframe: true,
            side: THREE.DoubleSide
        })
    )
    displacement.interactivePlane.visible = false
    scene.add(displacement.interactivePlane)

    /**
     * Raycaster
     */
    displacement.rayCaster = new THREE.Raycaster()

    // Coordinates
    displacement.screenCursor = new THREE.Vector2(999, 999)
    displacement.canvasCursor = new THREE.Vector2(999, 999)
    displacement.canvasCursorPrevious = new THREE.Vector2(999, 999)

    window.addEventListener('pointermove', (event) => {    // pointer move works on mobile too
        // for ray caster to work, we need to convert 
        // the mouse movement range according to clipspace
        displacement.screenCursor.x = ((event.clientX / sizes.width) * 2) - 1

        // the clipspace for y-axis should be from -1 to 1 from bottom to top, 
        // by default clientY starts from top, so inverting with - (minus)
        displacement.screenCursor.y = - (((event.clientY / sizes.height) * 2) - 1)
    })

    // Texture
    displacement.texture = new THREE.CanvasTexture(displacement.canvas)

    /**
     * Particles
     */
    particles.particlesGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight, planeSegment, planeSegment)
    particles.particlesGeometry.setIndex(null)
    particles.particlesGeometry.deleteAttribute('normal')

    const count = particles.particlesGeometry.attributes.position.count;
    const intensityArray = new Float32Array(count)
    const anglesArray = new Float32Array(count)

    for (let i = 0; i < count; i++) {
        intensityArray[i] = Math.random()
        anglesArray[i] = Math.random() * Math.PI * 2
    }

    particles.particlesGeometry.setAttribute('aDisplacementIntensity', new THREE.BufferAttribute(intensityArray, 1))
    particles.particlesGeometry.setAttribute('aDisplacementAngle', new THREE.BufferAttribute(anglesArray, 1))
    particles.particlesMaterial = new THREE.ShaderMaterial({
        vertexShader: particlesVertexShader,
        fragmentShader: particlesFragmentShader,
        uniforms:
        {
            uResolution: new THREE.Uniform(new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)),
            uPictureTexture: new THREE.Uniform(texture),
            uColorIntensity: new THREE.Uniform(2.0),
            uParticleSize: new THREE.Uniform(particles.size),
            uDisplacementTexture: new THREE.Uniform(displacement.texture),
            uTime: new THREE.Uniform(0)
        },
        transparent: true
    })
    particles.particlesMesh = new THREE.Points(particles.particlesGeometry, particles.particlesMaterial)
    scene.add(particles.particlesMesh)
}

createInteractivePlane(loadedTexture, loadedTextureProps)

// context
displacement.context = displacement.canvas.getContext('2d')
// displacement.context.fillStyle = '#ff0000'
displacement.context.fillRect(0, 0, displacement.canvas.width, displacement.canvas.height)

//Glow Image
displacement.glowImage = new Image()
displacement.glowImage.src = '/glow.png'

if (gui && Object.keys(particles).length > 0) {
    gui.addBinding(particles, 'size', {
        min: 0,
        max: 1,
        step: 0.001,
        label: 'Particle Size'
    }).on('change', (value) => {
        particles.particlesMaterial.uniforms.uParticleSize.value = value.value
    })

    gui.addButton({
        title: 'Godzilla'
    }).on('click', async () => {
        const loadedTexture = await loadTexture(textures[0])
        loadedTextureProps.width = loadedTexture.image.width
        loadedTextureProps.height = loadedTexture.image.height
        createInteractivePlane(loadedTexture, loadedTextureProps)
    })

    gui.addButton({
        title: 'Jett from Valorant'
    }).on('click', async () => {
        const loadedTexture = await loadTexture(textures[1])
        loadedTextureProps.width = loadedTexture.image.width
        loadedTextureProps.height = loadedTexture.image.height
        createInteractivePlane(loadedTexture, loadedTextureProps)
    })

    gui.addButton({
        title: 'Jett from Valorant Again'
    }).on('click', async () => {
        const loadedTexture = await loadTexture(textures[2])
        loadedTextureProps.width = loadedTexture.image.width
        loadedTextureProps.height = loadedTexture.image.height
        createInteractivePlane(loadedTexture, loadedTextureProps)
    })

    gui.addButton({
        title: 'Pacman'
    }).on('click', async () => {
        const loadedTexture = await loadTexture(textures[3])
        loadedTextureProps.width = loadedTexture.image.width
        loadedTextureProps.height = loadedTexture.image.height
        createInteractivePlane(loadedTexture, loadedTextureProps)
    })
}

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    stats.begin()

    // Update controls
    controls.update()

    particles.particlesMaterial.uniforms.uTime.value = elapsedTime

    /**
     * Raycaster
     */
    displacement.rayCaster.setFromCamera(displacement.screenCursor, camera)
    const intersections = displacement.rayCaster.intersectObject(displacement.interactivePlane)

    if (intersections.length) {
        const uv = intersections[0].uv
        displacement.canvasCursor.x = uv.x * displacement.canvas.width

        //uv coordinates are positive from bottom to top, we want from top to bottom 
        displacement.canvasCursor.y = (1 - uv.y) * displacement.canvas.height
    }

    /**
     * Displacement
     */
    // fade out
    displacement.context.globalCompositeOperation = 'source-over'
    displacement.context.globalAlpha = 0.02
    displacement.context.fillRect(0, 0, displacement.canvas.width, displacement.canvas.height)

    // Speed Alpha
    const cursorDistance = displacement.canvasCursorPrevious.distanceTo(displacement.canvasCursor)
    displacement.canvasCursorPrevious.copy(displacement.canvasCursor)
    const alpha = Math.min(cursorDistance * 0.1, 1)

    // draw glow
    const glowSize = displacement.canvas.width / 4
    displacement.context.globalCompositeOperation = 'lighten'
    displacement.context.globalAlpha = alpha
    displacement.context.drawImage(
        displacement.glowImage,
        displacement.canvasCursor.x - (glowSize * 0.5),
        displacement.canvasCursor.y - (glowSize * 0.5),
        glowSize,
        glowSize
    )

    // Texture
    displacement.texture.needsUpdate = true

    // Render
    renderer.render(scene, camera)

    stats.end()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()