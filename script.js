const board = document.getElementById('board');
const colorCirclesContainer = document.getElementById('colorCircles');
const colorTrianglesContainer = document.getElementById('colorTriangles');
const colorSquaresContainer = document.getElementById('colorSquares');
const spriteNameInput = document.getElementById('sprite-name-input');

// Event listeners for spawning shapes
const shapeContainers = [
    { container: colorCirclesContainer, shapeClass: 'color-circle', type: 'circle' },
    { container: colorTrianglesContainer, shapeClass: 'color-triangle', type: 'triangle' },
    { container: colorSquaresContainer, shapeClass: 'color-square', type: 'square' },
];

shapeContainers.forEach(({ container, shapeClass, type }) => {
    container.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains(shapeClass)) {
            const backgroundImage = getComputedStyle(e.target).backgroundImage;
            spawnShapeAtCursor(type, backgroundImage);
        }
    });
});

// Resize color elements when window size changes
function resizeElements() {
    const boardSize = board.offsetWidth;
    const elementSize = boardSize / 25;

    document.querySelectorAll('.color-square, .color-circle, .color-triangle').forEach(element => {
        element.style.width = `${elementSize}px`;
        element.style.height = `${elementSize}px`;
    });
}

window.addEventListener('resize', resizeElements);
resizeElements();

// Resize the board and sprites when window size changes
function resizeBoard() {
    const size = window.innerHeight * 0.6;
    board.style.width = `${size}px`;
    board.style.height = `${size}px`;
    resizeSprites();
}

window.addEventListener('resize', resizeBoard);
window.addEventListener('load', resizeBoard);

// Spawn shape at cursor
function spawnShapeAtCursor(shapeType, backgroundImage) {
    const spriteName = spriteNameInput.value.trim();
    const spriteSize = board.getBoundingClientRect().width / 15;
    const sprite = createShapeElement(shapeType, backgroundImage, spriteSize);

    // Name label for the sprite if provided
    if (spriteName) {
        addNameLabel(sprite, spriteName);
        spriteNameInput.value = '';
    }

    document.body.appendChild(sprite);
    makeSpriteDraggable(sprite);
    resizeSprites();
}

// Create shape element based on type
function createShapeElement(shapeType, backgroundImage, size) {
    const sprite = document.createElement('div');
    sprite.className = `sprite ${shapeType}`;
    sprite.style.backgroundImage = backgroundImage;
    sprite.style.width = `${size}px`;
    sprite.style.height = `${size}px`;
    sprite.style.position = 'absolute';

    const { left, width, top, height } = board.getBoundingClientRect();
    sprite.style.left = `${left + width / 2 - size / 2}px`;
    sprite.style.top = `${top + height / 2 - size / 2}px`;

    createSpriteControls(sprite, size);
    return sprite;
}

// Add name label to sprite
function addNameLabel(sprite, name) {
    const nameLabel = document.createElement('div');
    nameLabel.className = 'sprite-name';
    nameLabel.innerText = name;
    sprite.appendChild(nameLabel);
}

// Add trashcan and rotation controls to a sprite
function createSpriteControls(sprite, size) {
    const overlay = document.createElement('div');
    overlay.className = 'sprite-overlay';

    const trashcan = createControl('trashcan', size, () => document.body.removeChild(sprite));
    const rotation = createControl('rotation', size);

    sprite.appendChild(overlay);
    sprite.appendChild(trashcan);
    sprite.appendChild(rotation);
}

// Create a control element
function createControl(className, size, onClick = null) {
    const control = document.createElement('div');
    control.className = className;
    control.style.width = `${size / 3}px`;
    control.style.height = `${size / 3}px`;
    control.style.bottom = `-${size / 6}px`;
    if (className === 'trashcan') control.style.right = `-${size / 6}px`;
    if (className === 'rotation') control.style.left = `-${size / 6}px`;

    if (onClick) control.addEventListener('click', onClick);
    return control;
}

// Resize all sprites on the board
function resizeSprites() {
    const boardRect = board.getBoundingClientRect();
    const spriteSize = boardRect.width / 15;

    document.querySelectorAll('.sprite').forEach(sprite => {
        sprite.style.width = `${spriteSize}px`;
        sprite.style.height = `${spriteSize}px`;

        ['trashcan', 'rotation'].forEach(controlClass => {
            const control = sprite.querySelector(`.${controlClass}`);
            const buttonSize = spriteSize / 3;
            control.style.width = `${buttonSize}px`;
            control.style.height = `${buttonSize}px`;
        });
    });
}

// Enable dragging and rotating of sprites
function makeSpriteDraggable(sprite) {
    let isDragging = false, isRotating = false, startX, startY, offsetX, offsetY, rotationStartY, initialRotationAngle = 0;

    const trashcan = sprite.querySelector('.trashcan');
    const rotation = sprite.querySelector('.rotation');

    sprite.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = sprite.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        trashcan.style.display = 'block';
        rotation.style.display = 'block';

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        if (isRotating) {
            const deltaY = e.clientY - rotationStartY;
            const newRotationAngle = initialRotationAngle - deltaY * 1.2;
            sprite.style.transform = `rotate(${newRotationAngle}deg)`;
        } else if (isDragging) {
            const newX = e.clientX - offsetX;
            const newY = e.clientY - offsetY;
            const spriteRect = sprite.getBoundingClientRect();
            const minX = 0, minY = 0, maxX = window.innerWidth - spriteRect.width, maxY = window.innerHeight - spriteRect.height;

            sprite.style.left = `${Math.min(Math.max(newX, minX), maxX)}px`;
            sprite.style.top = `${Math.min(Math.max(newY, minY), maxY)}px`;
        }
    }

    function onMouseUp() {
        isDragging = false;
        isRotating = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    rotation.addEventListener('mousedown', (e) => {
        isRotating = true;
        rotationStartY = e.clientY;
        const currentRotation = sprite.style.transform.match(/rotate\((.*)deg\)/);
        initialRotationAngle = currentRotation ? parseFloat(currentRotation[1]) : 0;

        isDragging = false;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

// Initialize color shapes
window.addEventListener('load', () => {
    initializeColorShapes('.ko_shape_bz', 'color-circle', colorCirclesContainer);
    initializeColorShapes('.kw_shape_bz', 'color-square', colorSquaresContainer);
    initializeColorShapes('.t_shape_bz', 'color-triangle', colorTrianglesContainer);
});

function initializeColorShapes(selector, className, container) {
    const styleOptions = document.querySelectorAll(selector);
    const spriteSize = container.clientWidth * 0.8; // Set size as a percentage of container width for better fit

    styleOptions.forEach(styleOption => {
        const shape = document.createElement('div');
        shape.className = className;
        shape.style.width = `${spriteSize}px`;
        shape.style.height = `${spriteSize}px`;
        shape.style.backgroundImage = getComputedStyle(styleOption).backgroundImage;
        shape.style.margin = '5px auto'; // Center elements and space them properly
        shape.style.display = 'block'; // Ensure each shape is displayed as a block element
        container.appendChild(shape);
    });
}
