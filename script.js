const board = document.getElementById('board');
const colorCirclesContainer = document.getElementById('colorCircles');
const colorTrianglesContainer = document.getElementById('colorTriangles');
const colorSquaresContainer = document.getElementById('colorSquares');
const spriteNameInput = document.getElementById('sprite-name-input');
const plusButton = document.querySelector('.plus-button');
const logo = document.querySelector('.project-logo');
const paletteContainer = document.querySelector('.color-picker');

// Generate a unique ID for each sprite
function generateUniqueId() {
    return `sprite-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function validtoken() {
    const token = localStorage.getItem('usrToken');
    if (!token) {
        window.location.href = 'https://dev.flow-xr.com/devenv/FlowSite/index.html';
        return;
    }
    fetch('https://api.flow-xr.com/devenv', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(response => {
            if (!response.ok) throw new Error('Invalid token');
            return response.json();
        })
        .catch(error => { console.error(error); });
}
window.onLoad = validtoken;

// Event listeners for spawning shapes
const shapeContainers = [
    { container: colorCirclesContainer, shapeClass: 'ko_shape_bz', type: 'circle' },
    { container: colorTrianglesContainer, shapeClass: 't_shape_bz', type: 'triangle' },
    { container: colorSquaresContainer, shapeClass: 'kw_shape_bz', type: 'square' },
];

shapeContainers.forEach(({ container, shapeClass, type }) => {
    container.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG') {
            const imageSrc = e.target.getAttribute('src');
            const uniqueId = generateUniqueId();
            console.log(`Spawning ${type} on board with image: ${imageSrc}`);
            spawnShapeOnBoard(type, imageSrc, uniqueId);
            TogetherJS.send({
                type: 'spawn-shape',
                shapeType: type,
                imageSrc: imageSrc,
                spriteId: uniqueId
            });
        }
    });
});

// Listen for TogetherJS spawn-shape event
TogetherJS.hub.on('spawn-shape', function (msg) {
    if (!msg.sameUrl) return;
    if (!document.getElementById(msg.spriteId)) {
        spawnShapeOnBoard(msg.shapeType, msg.imageSrc, msg.spriteId);
    } else {
        console.warn(`Sprite with ID ${msg.spriteId} already exists.`);
    }
});
resizeBoard();

function resizeBoard() {
    // Calculate board size as the minimum of 70% of the window's width and 70% of the window's height
    const boardSize = Math.min(window.innerWidth * 0.7, window.innerHeight * 0.7);
    board.style.width = `${boardSize}px`;
    board.style.height = `${boardSize}px`;
    resizeSprites();
    console.log("Resized the board to a square of size:", boardSize);
}

window.addEventListener('resize', resizeBoard);
window.addEventListener('load', resizeBoard);

function togglePaletteVisibility() {
    if (paletteContainer.style.display === 'none' || paletteContainer.style.display === '') {
        paletteContainer.style.display = 'flex';
        plusButton.src = 'assets/x-button.svg';
    }
    else {
        paletteContainer.style.display = 'none';
        plusButton.src = 'assets/plus-button.svg';
    }
}

plusButton.addEventListener('click', togglePaletteVisibility);
paletteContainer.style.display = 'none';

function spawnShapeOnBoard(shapeType, imageSrc, spriteId) {
    paletteContainer.style.display = 'none';
    plusButton.src = 'assets/plus-button.svg';
    const spriteName = spriteNameInput.value.trim();
    const spriteSize = board.getBoundingClientRect().width / 15;
    const sprite = createShapeElement(shapeType, imageSrc, spriteSize, spriteId);
    if (spriteName) {
        addNameLabel(sprite, spriteName);
        spriteNameInput.value = '';
    }
    // Set initial position using percentage values
    const initialXPercent = 47;
    const initialYPercent = 5;
    sprite.dataset.xPercent = initialXPercent;
    sprite.dataset.yPercent = initialYPercent;
    sprite.style.left = `${initialXPercent}%`;
    sprite.style.top = `${initialYPercent}%`;
    sprite.style.display = 'flex';
    board.appendChild(sprite);
    makeSpriteDraggable(sprite);
    resizeSprites();
    console.log(`Spawned a ${shapeType} on the board.`);
}

function createShapeElement(shapeType, imageSrc, size, spriteId) {
    const sprite = document.createElement('div');
    sprite.id = spriteId;
    sprite.className = `sprite ${shapeType}`;
    sprite.style.width = `${size}px`;
    sprite.style.height = `${size}px`;
    sprite.style.position = 'absolute';
    sprite.style.display = 'flex';
    sprite.style.backgroundColor = 'transparent';
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.width = '100%';
    img.style.height = '100%';
    sprite.appendChild(img);
    sprite.style.left = `47%`;
    sprite.style.top = `5%`;
    sprite.proportion = 1;
    createSpriteControls(sprite, size);
    console.log(`Created a ${shapeType} element with image: ${imageSrc} at position (${sprite.style.left}, ${sprite.style.top}).`);
    return sprite;
}

function addNameLabel(sprite, name) {
    const nameLabel = document.createElement('div');
    nameLabel.className = 'sprite-name';
    nameLabel.innerText = name;
    sprite.appendChild(nameLabel);
    console.log(`Added name label: ${name}`);
}

function createSpriteControls(sprite, size) {
    const trashcan = createControl('trashcan', size, () => {
        board.removeChild(sprite);
        console.log("Sprite removed from board.");
        TogetherJS.send({
            type: 'remove-shape',
            spriteId: sprite.id
        });
    });
    const resize = createControl('size', size);
    const rotation = createControl('rotation', size);
    sprite.appendChild(trashcan);
    sprite.appendChild(resize);
    sprite.appendChild(rotation);
    positionControls(sprite);
    const observer = new ResizeObserver(() => positionControls(sprite));
    observer.observe(sprite);
    console.log("Added controls to sprite.");
}

function positionControls(sprite) {
    const size = sprite.offsetWidth;
    const trashcan = sprite.querySelector('.trashcan');
    const resize = sprite.querySelector('.size');
    const rotation = sprite.querySelector('.rotation');
    const controlOffset = size / 6;
    rotation.style.position = 'absolute';
    rotation.style.left = `-${controlOffset}px`;
    rotation.style.bottom = `-${controlOffset}px`;
    resize.style.position = 'absolute';
    resize.style.right = `-${controlOffset}px`;
    resize.style.top = `-${controlOffset}px`;
    trashcan.style.position = 'absolute';
    trashcan.style.right = `-${controlOffset}px`;
    trashcan.style.bottom = `-${controlOffset}px`;
    console.log("Updated positions of sprite controls.");
}

function createControl(className, size, onClick = null) {
    const control = document.createElement('div');
    control.className = className;
    control.style.width = `${size / 3}px`;
    control.style.height = `${size / 3}px`;
    if (onClick) control.addEventListener('click', onClick);
    console.log(`Created control: ${className}`);
    return control;
}

TogetherJS.hub.on('remove-shape', function (msg) {
    if (!msg.sameUrl) return;
    const sprite = document.getElementById(msg.spriteId);
    if (sprite) {
        board.removeChild(sprite);
    } else {
        console.warn(`Sprite with ID ${msg.spriteId} not found.`);
    }
});

function resizeSprites() {
    const boardRect = board.getBoundingClientRect();
    const baseSpriteSize = boardRect.height / 12;
    const logoSize = boardRect.height / 5;
    const plusButtonSize = boardRect.height / 10;
    plusButton.style.width = `${plusButtonSize}px`;
    plusButton.style.height = `${plusButtonSize}px`;
    logo.style.width = `${logoSize}px`;
    logo.style.height = `${logoSize / 2.5}px`;
    logo.style.left = '10px';
    logo.style.top = '10px';
    document.querySelectorAll('.sprite').forEach(sprite => {
        const xPercent = sprite.dataset.xPercent || 0;
        const yPercent = sprite.dataset.yPercent || 0;
        sprite.style.left = `${xPercent}%`;
        sprite.style.top = `${yPercent}%`;
        const newWidth = baseSpriteSize * sprite.proportion;
        const newHeight = baseSpriteSize * sprite.proportion;
        sprite.style.width = `${newWidth}px`;
        sprite.style.height = `${newHeight}px`;
        ['trashcan', 'rotation', 'size'].forEach(controlClass => {
            const control = sprite.querySelector(`.${controlClass}`);
            if (control) {
                const controlSize = newWidth / 3;
                control.style.width = `${controlSize}px`;
                control.style.height = `${controlSize}px`;
            }
        });
    });
    console.log("Resized all sprites on the board using percentage-based positioning.");
}

function makeSpriteDraggable(sprite) {
    let isDragging = false,
        offsetX, offsetY;
    sprite.addEventListener('mousedown', (e) => {
        if (['trashcan', 'rotation', 'size'].includes(e.target.className)) return;
        isDragging = true;
        const rect = sprite.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        sprite.style.zIndex = '10000';
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        console.log("Started dragging sprite.");
    });
    function onMouseMove(e) {
        if (isDragging) {
            const boardRect = board.getBoundingClientRect();
            const newX = (e.clientX - boardRect.left - offsetX) / boardRect.width * 100;
            const newY = (e.clientY - boardRect.top - offsetY) / boardRect.height * 100;
            sprite.dataset.xPercent = newX;
            sprite.dataset.yPercent = newY;
            sprite.style.left = `${newX}%`;
            sprite.style.top = `${newY}%`;
            TogetherJS.send({
                type: 'drag-move',
                spriteId: sprite.id,
                xPercent: newX,
                yPercent: newY
            });
        }
    }
    function onMouseUp() {
        isDragging = false;
        sprite.style.zIndex = '100';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        console.log("Stopped dragging sprite.");
    }
    TogetherJS.hub.on('drag-move', function (msg) {
        if (!msg.sameUrl || msg.spriteId !== sprite.id) return;
        sprite.dataset.xPercent = msg.xPercent;
        sprite.dataset.yPercent = msg.yPercent;
        sprite.style.left = `${msg.xPercent}%`;
        sprite.style.top = `${msg.yPercent}%`;
    });
}

function resizeElement(sprite, initialWidth, initialHeight, proportion) {
    const newWidth = initialWidth * proportion;
    const newHeight = initialHeight * proportion;
    if (newWidth > 20 && newHeight > 20) {
        sprite.style.width = `${newWidth}px`;
        sprite.style.height = `${newHeight}px`;
        sprite.querySelectorAll('.trashcan, .rotation, .size').forEach(control => {
            const controlSize = newWidth / 3;
            control.style.width = `${controlSize}px`;
            control.style.height = `${controlSize}px`;
        });
        console.log(`Resized sprite to width: ${newWidth}px, height: ${newHeight}px with proportion: ${proportion}`);
    }
}
