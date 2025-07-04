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
            const uniqueId = generateUniqueId(); // Generate unique ID for each sprite
            console.log(`Spawning ${type} on board with image: ${imageSrc}`);
            spawnShapeOnBoard(type, imageSrc, uniqueId);
            // Emit event via TogetherJS to synchronize spawning across all users
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

    // Check if the sprite already exists to avoid duplication
    if (!document.getElementById(msg.spriteId)) {
        spawnShapeOnBoard(msg.shapeType, msg.imageSrc, msg.spriteId);
    } else {
        console.warn(`Sprite with ID ${msg.spriteId} already exists.`);
    }
});
resizeBoard();

function resizeBoard() {
    const height = window.innerHeight; // 90% of the window height
    const width = window.innerWidth; // Width is always 1.5 times the height

    board.style.width = `${width}px`; // Set the calculated width
    board.style.height = `${height}px`; // Set the calculated height

    resizeSprites(); // Resize sprites based on the new board size
    console.log("Resized the board and sprites with width 1.5 times the height.");
}

window.addEventListener('resize', resizeBoard);
window.addEventListener('load', resizeBoard);

function togglePaletteVisibility() {
    if (paletteContainer.style.display === 'none' || paletteContainer.style.display === '') {
        paletteContainer.style.display = 'flex'; // Show the palette
        plusButton.src = 'assets/x-button.svg'; // Change to x-button.svg
    }
    else {
        paletteContainer.style.display = 'none'; // Hide the palette
        plusButton.src = 'assets/plus-button.svg'; // Change back to plus-button.svg
    }
}

// Add an event listener to the plus button to toggle the palette visibility
plusButton.addEventListener('click', togglePaletteVisibility);

// Initially hide the palette container
paletteContainer.style.display = 'none';

function spawnShapeOnBoard(shapeType, imageSrc, spriteId) {
    paletteContainer.style.display = 'none';
    plusButton.src = 'assets/plus-button.svg';

    const spriteName = spriteNameInput.value.trim();
    const spriteSize = board.getBoundingClientRect().width / 15;
    const sprite = createShapeElement(shapeType, imageSrc, spriteSize, spriteId);

    if (spriteName) {
        const nameLabel = addNameLabel(sprite, spriteName);
        enableNameEditing(sprite, nameLabel);
        spriteNameInput.value = '';
    }


    sprite.style.display = 'flex'; // Ensure the sprite is displayed as a flex element
    board.appendChild(sprite); // Append sprite to the board
    makeSpriteDraggable(sprite);
    resizeSprites();

    console.log(`Spawned a ${shapeType} on the board.`);
}

function createShapeElement(shapeType, imageSrc, size, spriteId) {
    const sprite = document.createElement('div');
    sprite.id = spriteId; // Set the unique sprite ID
    sprite.className = `sprite ${shapeType}`;
    sprite.style.width = `${size}px`;
    sprite.style.height = `${size}px`;
    sprite.style.position = 'absolute';
    sprite.style.display = 'flex'; // Ensure it displays
    sprite.style.backgroundColor = 'transparent'; // Ensure no background color

    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.width = '100%';
    img.style.height = '100%';
    sprite.appendChild(img);

    sprite.style.left = `47%`; // Center within the board
    sprite.style.top = `5%`; // Position sprite just above the board

    sprite.proportion = 1; // Set initial proportion to 1
    createSpriteControls(sprite, size);
    console.log(`Created a ${shapeType} element with image: ${imageSrc} at position (${sprite.style.left}, ${sprite.style.top}).`);

    return sprite;
}

function addNameLabel(sprite, name) {
    // usuń starą etykietę, jeśli istnieje
    const old = sprite.querySelector('.sprite-name');
    if (old) sprite.removeChild(old);

    const nameLabel = document.createElement('div');
    nameLabel.className = 'sprite-name';
    nameLabel.innerText = name;
    sprite.appendChild(nameLabel);
    console.log(`Added name label: ${name}`);
    return nameLabel;
}


function enableNameEditing(sprite, nameLabel) {
    nameLabel.style.cursor = 'pointer';

    nameLabel.addEventListener('click', () => {
        const currentName = nameLabel.innerText;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'sprite-name-input-inline';

        // --- TU DODAJEMY BEZPOŚREDNIO STYLOWANIE, KTÓRE UPEWNI SIĘ,
        //     ŻE INPUT ZAWSZE LĄDUJE NAD SPRITE'M: ---
        Object.assign(input.style, {
            position: 'absolute',
            bottom: 'calc(100% + 5px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '1001',
            // opcjonalnie: szerokość i font można tu doprecyzować,
            // jeśli CSS nadal nie nadpisuje
        });
        // ----------------------------------------------------------------

        sprite.replaceChild(input, nameLabel);
        input.focus();
        input.select();

        const finishEditing = () => {
            const newName = input.value.trim() || currentName;
            const newLabel = document.createElement('div');
            newLabel.className = 'sprite-name';
            newLabel.innerText = newName;
            sprite.replaceChild(newLabel, input);
            enableNameEditing(sprite, newLabel);
            // TogetherJS.send({ ... })
        };

        input.addEventListener('blur', finishEditing);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') finishEditing();
            else if (e.key === 'Escape') sprite.replaceChild(nameLabel, input);
        });
    });
}


function createSpriteControls(sprite, size) {
    const trashcan = createControl('trashcan', size, () => {
        board.removeChild(sprite);
        console.log("Sprite removed from board.");

        // Emit event via TogetherJS to remove the sprite across all users
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
    const size = sprite.offsetWidth; // Sprite size
    const trashcan = sprite.querySelector('.trashcan');
    const resize = sprite.querySelector('.size');
    const rotation = sprite.querySelector('.rotation');

    // Calculate positions for each control
    const controlOffset = size / 6; // Offset for control placement

    // Top-left (Rotation)
    rotation.style.position = 'absolute';
    rotation.style.left = `-${controlOffset}px`;
    rotation.style.bottom = `-${controlOffset}px`;

    // Top-right (Resize)
    resize.style.position = 'absolute';
    resize.style.right = `-${controlOffset}px`;
    resize.style.top = `-${controlOffset}px`;

    // Bottom-right (Trashcan)
    trashcan.style.position = 'absolute';
    trashcan.style.right = `-${controlOffset}px`;
    trashcan.style.bottom = `-${controlOffset}px`;

    console.log("Updated positions of sprite controls.");
}

function createControl(className, size, onClick = null) {
    const control = document.createElement('div');
    control.className = className;
    control.style.width = `${size / 3}px`; // Adjust size relative to sprite
    control.style.height = `${size / 3}px`;

    if (onClick) control.addEventListener('click', onClick);
    console.log(`Created control: ${className}`);

    return control;
}


// Listen for TogetherJS remove-shape event
TogetherJS.hub.on('remove-shape', function (msg) {
    if (!msg.sameUrl) return;

    const sprite = document.getElementById(msg.spriteId);
    if (sprite) {
        board.removeChild(sprite);
    } else {
        console.warn(`Sprite with ID ${msg.spriteId} not found.`);
    }
});

// Adjust sprite size using proportion
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
    logo.style.top = '10px'

    document.querySelectorAll('.sprite').forEach(sprite => {
        const newWidth = baseSpriteSize * sprite.proportion; // Apply proportion to base size
        const newHeight = baseSpriteSize * sprite.proportion; // Apply proportion to base size

        sprite.style.width = `${newWidth}px`;
        sprite.style.height = `${newHeight}px`;

        // Resize controls (trashcan, rotation, size) accordingly
        ['trashcan', 'rotation', 'size'].forEach(controlClass => {
            const control = sprite.querySelector(`.${controlClass}`);
            const controlSize = newWidth / 3;
            control.style.width = `${controlSize}px`;
            control.style.height = `${controlSize}px`;
        });
    });

    console.log("Resized all sprites on the board with proportion.");
}

function makeSpriteDraggable(sprite) {
    let isDragging = false,
        isRotating = false,
        isResizing = false,
        offsetX, offsetY, rotationStartY, initialRotationAngle = 0,
        initialHeight, initialWidth, startY;

    const trashcan = sprite.querySelector('.trashcan');
    const rotation = sprite.querySelector('.rotation');
    const size = sprite.querySelector('.size');

    sprite.addEventListener('mousedown', (e) => {
        if (e.target === trashcan || e.target === rotation || e.target === size) return;

        isDragging = true;
        const rect = sprite.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        sprite.style.zIndex = '10000';
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        console.log("Started dragging sprite.");
    });

    size.addEventListener('mousedown', (e) => {
        // Start resizing when the size control is clicked
        isResizing = true;
        startY = e.clientY;
        initialWidth = sprite.offsetWidth;
        initialHeight = sprite.offsetHeight;
        sprite.style.zIndex = '10000';

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        console.log("Started resizing sprite.");
    });

    function onMouseMove(e) {
        if (isRotating) {
            const deltaY = e.clientY - rotationStartY;
            const newRotationAngle = initialRotationAngle - deltaY * 1.2;
            sprite.style.transform = `rotate(${newRotationAngle}deg)`;
            TogetherJS.send({
                type: 'rotate-shape',
                spriteId: sprite.id,
                angle: newRotationAngle
            });
        }
        else if (isDragging) {
            const boardRect = board.getBoundingClientRect();
            const newX = e.clientX - boardRect.left - offsetX;
            const newY = e.clientY - boardRect.top - offsetY;
            sprite.style.left = `${newX}px`;
            sprite.style.top = `${newY}px`;

            TogetherJS.send({
                type: 'drag-move',
                spriteId: sprite.id,
                newX,
                newY
            });
        }
        else if (isResizing) {
            const deltaY = startY - e.clientY;
            const scaleFactor = deltaY / 200; // Adjust scaling sensitivity
            sprite.proportion += scaleFactor; // Update the proportion value
            sprite.proportion = Math.max(0.2, sprite.proportion); // Prevent proportion from going too low
            resizeSprites(); // Now the proportion will be applied here
            startY = e.clientY; // Reset startY to allow smooth resizing
        }
    }

    function onMouseUp() {
        isDragging = false;
        isRotating = false;
        isResizing = false;
        sprite.style.zIndex = '100';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        console.log(`Stopped dragging or resizing sprite. Final proportion: ${sprite.proportion}`);
    }

    rotation.addEventListener('mousedown', (e) => {
        isRotating = true;
        rotationStartY = e.clientY;
        const currentRotation = sprite.style.transform.match(/rotate\((.*)deg\)/);
        initialRotationAngle = currentRotation ? parseFloat(currentRotation[1]) : 0;

        isDragging = false;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        console.log("Started rotating sprite.");
    });

    // Listen for TogetherJS drag and rotate events
    TogetherJS.hub.on('drag-move', function (msg) {
        if (!msg.sameUrl || msg.spriteId !== sprite.id) return;
        sprite.style.left = `${msg.newX}px`;
        sprite.style.top = `${msg.newY}px`;
    });

    TogetherJS.hub.on('rotate-shape', function (msg) {
        if (!msg.sameUrl || msg.spriteId !== sprite.id) return;
        sprite.style.transform = `rotate(${msg.angle}deg)`;
    });
}