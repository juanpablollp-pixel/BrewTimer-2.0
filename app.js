// ==========================================
// 1. SERVICE WORKER
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.error('❌ SW:', err));
    });
}

// ==========================================
// 2. BASE DE DATOS Y GESTIÓN DE RECETAS
// ==========================================
const defaultRecipes = [
    {
        id: 'v60-clasico', name: 'V60 Clásico', method: 'V60', coffee: 15, water: 250,
        temp: 93, grind: 'Media-Fina', roast: 'Medio',
        steps: [
            { name: 'Vertido', targetWater: 50, duration: 30, type: 'vertido' },
            { name: 'Espera (Bloom)', targetWater: 0, duration: 30, type: 'espera' },
            { name: 'Vertido', targetWater: 100, duration: 60, type: 'vertido' },
            { name: 'Espera', targetWater: 0, duration: 30, type: 'espera' },
            { name: 'Vertido', targetWater: 100, duration: 60, type: 'vertido' }
        ]
    }
];

function getAllRecipes() {
    let savedRecipes = localStorage.getItem('myCoffeeRecipes');
    if (!savedRecipes) {
        localStorage.setItem('myCoffeeRecipes', JSON.stringify(defaultRecipes));
        return defaultRecipes;
    }
    return JSON.parse(savedRecipes);
}

// ==========================================
// 3. RENDERIZADO DEL MENÚ PRINCIPAL
// ==========================================
function renderRecipeList() {
    const appContent = document.getElementById('app-content');
    const allRecipes = getAllRecipes();
    
    let html = `
        <div style="display: flex; flex-direction: column; align-items: center; padding: 20px 0 10px 0; width: 100%;">
            <div style="display: flex; align-items: flex-end; gap: 10px; padding-bottom: 5px;">
                <img src="logo.png" alt="Logo" style="height: 50px; width: auto; display: block;">
                <h1 style="font-family: 'montserrattitulo', sans-serif; font-size: 38px; margin: 0; color: #2a2529; line-height: 0.9;">
                    BrewTimer
                </h1>
            </div>
        </div>

        <div style="display: flex; gap: 15px; width: 90%; max-width: 350px; margin: 30px auto;">
            <button onclick="renderRecipeForm()" style="flex: 1; padding: 16px 10px; background-color: #2a2529; color: #f3f0e7; border: none; border-radius: 15px; font-family: montserratsubtitulos, sans-serif; font-size: 15px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(44, 30, 22, 0.15);">
                Crear Receta
            </button>
            <button onclick="renderRatioCalculator()" style="flex: 1; padding: 16px 10px; background-color: #2a2529; color: #f3f0e7; border: none; border-radius: 15px; font-family: montserratsubtitulos, sans-serif; font-size: 15px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(44, 30, 22, 0.15);">
                Calcular Ratio
            </button>
        </div>

        <div style="padding: 0 20px; width: 100%; box-sizing: border-box;">
    <h2 style="font-family: 'montserratsubtitulos', sans-serif; font-weight: 300; font-size: 22px; color: #2a2529; border-bottom: 2px solid #2a2529; margin-bottom: 20px; padding-bottom: 5px; width: 100%;">
        MIS RECETAS
    </h2>
</div>
    `;
    
    if (allRecipes.length === 0) {
        html += `
            <div style="text-align: center; color: #888; padding: 40px 20px; background: #fff; margin: 0 20px; border-radius: 15px; border: 1px dashed #ccc;">
                <p style="font-size: 40px; margin: 0 0 10px 0;">☕</p>
                <p style="margin: 0; font-size: 16px;">Aún no tienes recetas.</p>
                <p style="margin: 5px 0 0 0; font-size: 14px;">¡Toca en "Crear Receta" para empezar!</p>
            </div>
        `;
    } else {
        allRecipes.forEach(recipe => {
            html += `
                <div style="position: relative; font-family: 'montserrattexto', sans-serif; background-color: #2a2529; margin: 0 20px 15px 20px; padding: 15px; border-radius: 15px; border: 1px solid #eee;">
                    
                    <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #f3f0e7; text-transform: capitalize; padding-right: 30px;">${recipe.name}</h3>
                    
                    <div style="position: absolute; top: 15px; right: 15px; display: flex; flex-direction: column; gap: 12px; align-items: center;">
                        <button onclick="editRecipe('${recipe.id}')" style="background: none; border: none; cursor: pointer; padding: 0; line-height: 0;">
                            <img src="editar.png" alt="Editar" style="width: 22px; height: 22px; object-fit: contain;">
                        </button>
                        <button onclick="showDeleteModal('${recipe.id}')" style="background: none; border: none; cursor: pointer; padding: 0; line-height: 0;">
                            <img src="eliminar.png" alt="Eliminar" style="width: 22px; height: 22px; object-fit: contain;">
                        </button>
                    </div>
                    
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; font-size: 13px; color: #f3f0e7;">
                        <div style="width: 45%;"> <b>Café:</b> ${recipe.coffee}g</div>
                        <div style="width: 45%;"> <b>Agua:</b> ${recipe.water}g</div>
                        <div style="width: 45%;"> <b>Temp:</b> ${recipe.temp || '-'}°C</div>
                        <div style="width: 45%; text-transform: capitalize;"> <b>Molienda:</b> ${recipe.grind || '-'}</div>
                        <div style="width: 45%; text-transform: capitalize;"> <b>Tueste:</b> ${recipe.roast || '-'}</div>
                        <div style="width: 45%;"> <b>Ratio:</b> ${recipe.ratio || '-'}</div>
                    </div>

                    <button onclick="iniciarPreparacion('${recipe.id}')" style="width: 100%; padding: 10px; font-size: 13px; font-weight: bold; background-color: #f3f0e7; color: #2a2529; border: none; border-radius: 50px; cursor: pointer; font-family: inherit;">
                        PREPARAR
                    </button>
                </div>
            `;
        });
    }

    appContent.innerHTML = html;
}

// ==========================================
// PANTALLA CALCULADORA DE RATIO
// ==========================================
function renderRatioCalculator() {
    const appContent = document.getElementById('app-content');
    
    appContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 10px 0 10px; margin-bottom: 30px;">
            
            <button onclick="renderRecipeList()" style="
                width: 40px; 
                height: 40px; 
                background: none; 
                border: none; 
                padding: 0; 
                cursor: pointer; 
                display: flex; 
                align-items: center; 
                justify-content: center;
            ">
                <img src="volver.png" alt="Volver" style="width: 100%; height: 100%; object-fit: contain;">
            </button>
            
            <h2 style="font-family: 'montserratsubtitulos', serif; font-size: 26px; color: #2c1e16; margin: 0; line-height: 1; text-align: center;">
                Calculadora
            </h2>
            
            <div style="width: 40px;"></div> 
            
        </div>
        
        <div id="calculadora-container" style="padding: 0 20px;">
            
            <div style="background-color: #2c1e16; border-radius: 15px; padding: 25px 20px; color: #fdfaf5; text-align: center; margin-bottom: 35px; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
                <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #d4a373; margin-bottom: 5px;">Ratio Seleccionado</div>
                <div style="font-size: 48px; margin-bottom: 15px; font-family: 'montserratsubtitulos', serif;">
                    1 : <span id="display-ratio">15</span>
                </div>
                
                <div style="display: flex; justify-content: space-around; align-items: center; border-top: 1px solid rgba(253, 250, 245, 0.1); padding-top: 15px;">
                    <div>
                        <div style="font-size: 12px; color: #bbb; margin-bottom: 5px;">Café</div>
                        <div style="font-size: 22px; font-family: 'montserratsubtitulos';">☕ <span id="display-coffee">15</span>g</div>
                    </div>
                    <div style="font-size: 24px; color: #d4a373;">=</div>
                    <div>
                        <div style="font-size: 12px; color: #bbb; margin-bottom: 5px;">Agua</div>
                        <div style="font-size: 22px; font-family: 'montserratsubtitulos';">💧 <span id="display-water">225</span>g</div>
                    </div>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 30px;">
                
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <label style="font-family: 'montserrattexto'; color: #2c1e16; font-size: 16px;">⚖️ Ratio (1:x)</label>
                        <span style="color: #888; font-family: 'montserrattexto'; font-size: 16px;" id="label-ratio">15</span>
                    </div>
                    <input type="range" id="slider-ratio" min="10" max="20" step="1" value="15" oninput="calcDesdeRatio()" style="width: 100%; height: 8px; border-radius: 5px; accent-color: #2c1e16; cursor: pointer;">
                </div>

                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <label style="font-family: 'montserrattexto'; color: #2c1e16; font-size: 16px;">☕ Café (g)</label>
                        <span style="color: #888; font-family: 'montserrattexto'; font-size: 16px;" id="label-coffee">15g</span>
                    </div>
                    <input type="range" id="slider-coffee" min="5" max="50" step="0.5" value="15" oninput="calcDesdeCafe()" style="width: 100%; height: 8px; border-radius: 5px; accent-color: #795548; cursor: pointer;">
                </div>

                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <label style="font-family: 'montserrattexto'; color: #2c1e16; font-size: 16px;">💧 Agua (g)</label>
                        <span style="color: #888; font-family: 'montserrattexto'; font-size: 16px;" id="label-water">225g</span>
                    </div>
                    <input type="range" id="slider-water" min="50" max="1000" step="5" value="225" oninput="calcDesdeAgua()" style="width: 100%; height: 8px; border-radius: 5px; accent-color: #2196F3; cursor: pointer;">
                </div>

            </div>
        </div>
    `;
}

// ==========================================
// LÓGICA MATEMÁTICA DE LA CALCULADORA
// ==========================================

function calcDesdeRatio() {
    const ratio = parseFloat(document.getElementById('slider-ratio').value);
    const coffee = parseFloat(document.getElementById('slider-coffee').value);
    const water = Math.round(coffee * ratio); // Calculamos agua
    
    document.getElementById('slider-water').value = water; // Movemos el corredor de agua automáticamente
    actualizarTextosCalculadora(ratio, coffee, water);
}

function calcDesdeCafe() {
    const ratio = parseFloat(document.getElementById('slider-ratio').value);
    const coffee = parseFloat(document.getElementById('slider-coffee').value);
    const water = Math.round(coffee * ratio); // Calculamos agua
    
    document.getElementById('slider-water').value = water; // Movemos el corredor de agua automáticamente
    actualizarTextosCalculadora(ratio, coffee, water);
}

function calcDesdeAgua() {
    const water = parseFloat(document.getElementById('slider-water').value);
    const ratio = parseFloat(document.getElementById('slider-ratio').value);
    const coffee = parseFloat((water / ratio).toFixed(1)); // Calculamos café y dejamos 1 decimal máximo
    
    document.getElementById('slider-coffee').value = coffee; // Movemos el corredor de café automáticamente
    actualizarTextosCalculadora(ratio, coffee, water);
}

function actualizarTextosCalculadora(ratio, coffee, water) {
    // 1. Actualiza el panel oscuro grande
    document.getElementById('display-ratio').innerText = ratio;
    document.getElementById('display-coffee').innerText = coffee;
    document.getElementById('display-water').innerText = water;
    
    // 2. Actualiza los números pequeños encima de cada corredor
    document.getElementById('label-ratio').innerText = ratio;
    document.getElementById('label-coffee').innerText = coffee + 'g';
    document.getElementById('label-water').innerText = water + 'g';
}

// ==========================================
// 4. SISTEMA DE ALERTAS Y MODALES
// ==========================================
function showToast(message) {
    const toast = document.createElement('div');
    toast.innerText = message;
    
    // Hemos añadido 'white-space: nowrap;' para evitar que el texto salte de línea,
    // y un 'min-width' para que el cartel tenga un buen tamaño base.
    toast.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        background-color: #333; color: white; padding: 12px 24px;
        border-radius: 50px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        z-index: 1000; transition: opacity 0.3s ease;
        white-space: nowrap; 
        text-align: center;
        min-width: 150px;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => { 
        toast.style.opacity = '0'; 
        setTimeout(() => toast.remove(), 300); 
    }, 3000);
}

function showDeleteModal(id) {
    const overlay = document.createElement('div');
    overlay.id = 'delete-modal';
    overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000;`;
    overlay.innerHTML = `
        <div style="background: white; padding: 25px; border-radius: 12px; width: 80%; max-width: 320px; text-align: center;">
            <h3 style="margin-top: 0;">¿Eliminar receta?</h3>
            <p style="color: #666; margin-bottom: 20px;">Esta acción no se puede deshacer.</p>
            <div style="display: flex; gap: 10px;">
                <button onclick="document.getElementById('delete-modal').remove()" style="flex: 1; padding: 12px; background: #e0e0e0; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Cancelar</button>
                <button onclick="executeDelete('${id}')" style="flex: 1; padding: 12px; background: #f44336; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Eliminar</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function executeDelete(id) {
    let savedRecipes = JSON.parse(localStorage.getItem('myCoffeeRecipes')) || [];
    localStorage.setItem('myCoffeeRecipes', JSON.stringify(savedRecipes.filter(r => r.id !== id)));
    document.getElementById('delete-modal').remove();
    renderRecipeList();
    showToast("🗑️ Receta eliminada");
}

function editRecipe(id) {
    const savedRecipes = JSON.parse(localStorage.getItem('myCoffeeRecipes')) || [];
    const recipeToEdit = savedRecipes.find(r => r.id === id);
    if (recipeToEdit) renderRecipeForm(recipeToEdit);
}

// ==========================================
// 5. FORMULARIO DE CREACIÓN/EDICIÓN ACTUALIZADO (CAMPOS CORTOS)
// ==========================================
let phaseCount = 0;

function renderRecipeForm(recipeToEdit = null) {
    const appContent = document.getElementById('app-content');
    const isEditing = recipeToEdit !== null;
    
    const title = isEditing ? "Modificar Receta" : "Crear Nueva Receta";
    const btnText = isEditing ? "Actualizar Receta" : "Guardar Receta";
    const recipeId = isEditing ? recipeToEdit.id : '';

    appContent.innerHTML = `
        <h2 style="text-align: center; font-family: 'Croissant One', serif; color: #2c1e16; margin-top: 20px;">${title}</h2>
        
        <form id="recipe-form" onsubmit="saveRecipe(event)" style="display: flex; flex-direction: column; gap: 15px; max-width: 400px; margin: 0 auto; padding: 0 15px 40px 15px;">

            <input type="hidden" id="r-id" value="${recipeId}">

            <div style="display: flex; flex-direction: column; gap: 5px;">
                <label style="font-size: 14px; color: #555; font-weight: bold;">Nombre de la Preparación:</label>
                <input type="text" id="r-name" required placeholder="Ej. Mi V60 Mañanero" value="${isEditing ? recipeToEdit.name : ''}" style="padding: 12px; border: 1px solid #ccc; border-radius: 8px; font-size: 16px;">
            </div>

            <div style="display: flex; flex-direction: column; gap: 5px;">
                <label style="font-size: 14px; color: #555; font-weight: bold;">Método:</label>
                <input type="text" id="r-method" required placeholder="Ej. V60, Chemex, Aeropress" value="${isEditing ? recipeToEdit.method : ''}" style="padding: 12px; border: 1px solid #ccc; border-radius: 8px; font-size: 16px;">
            </div>

            <div style="display: flex; gap: 10px;">
                <div style="flex: 1; display: flex; flex-direction: column; gap: 5px;">
                    <label style="font-size: 14px; color: #555; font-weight: bold;">Café (g):</label>
                    <input type="number" id="r-coffee" required value="${isEditing ? recipeToEdit.coffee : ''}" style="width: 100%; padding: 12px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 8px; font-size: 16px;">
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; gap: 5px;">
                    <label style="font-size: 14px; color: #555; font-weight: bold;">Agua (g):</label>
                    <input type="number" id="r-water" required value="${isEditing ? recipeToEdit.water : ''}" style="width: 100%; padding: 12px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 8px; font-size: 16px;">
                </div>
            </div>

            <div style="display: flex; gap: 10px;">
                <div style="flex: 1; display: flex; flex-direction: column; gap: 5px;">
                    <label style="font-size: 14px; color: #555; font-weight: bold;">Temp. °C:</label>
                    <input type="number" id="r-temp" value="${isEditing && recipeToEdit.temp ? recipeToEdit.temp : ''}" style="width: 100%; padding: 12px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 8px; font-size: 16px;">
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; gap: 5px;">
                    <label style="font-size: 14px; color: #555; font-weight: bold;">Molienda:</label>
                    <input type="text" id="r-grind" placeholder="Ej. Media" value="${isEditing ? recipeToEdit.grind : ''}" style="width: 100%; padding: 12px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 8px; font-size: 16px;">
                </div>
            </div>

            <div style="display: flex; gap: 10px;">
                <div style="flex: 1; display: flex; flex-direction: column; gap: 5px;">
                    <label style="font-size: 14px; color: #555; font-weight: bold;">Tueste:</label>
                    <input type="text" id="r-roast" placeholder="Ej. Claro" value="${isEditing && recipeToEdit.roast ? recipeToEdit.roast : ''}" style="width: 100%; padding: 12px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 8px; font-size: 16px;">
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; gap: 5px;">
                    <label style="font-size: 14px; color: #555; font-weight: bold;"> Ratio:</label>
                    <input type="text" id="r-ratio" placeholder="Ej. 1:15" value="${isEditing && recipeToEdit.ratio ? recipeToEdit.ratio : ''}" style="width: 100%; padding: 12px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 8px; font-size: 16px;">
                </div>
            </div>

            <hr style="width: 100%; margin: 15px 0; border: 0; border-top: 1px solid #e0dcd2;">
            
            <h3 style="margin: 0; text-align: center; color: #2c1e16; font-family: 'Croissant One', serif;">Fases de Preparación</h3>
            <div id="phases-container"></div>
            
            <div style="display: flex; gap: 10px; align-items: center; margin-top: 10px;">
                <button type="button" onclick="addPhase('vertido')" style="padding: 12px; background-color: #2196F3; color: white; border: none; border-radius: 50px; flex: 1; cursor: pointer; font-weight: bold;">+ Vertido</button>
                <button type="button" onclick="addPhase('espera')" style="padding: 12px; background-color: #FF9800; color: white; border: none; border-radius: 50px; flex: 1; cursor: pointer; font-weight: bold;">+ Espera</button>
            </div>
            
            <div style="background-color: #fdfaf5; border: 1px solid #e0dcd2; padding: 15px; border-radius: 12px; text-align: center; margin-top: 20px;">
                <b style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Totales de la receta</b> <br>
                <span style="font-size: 24px; color: #2c1e16; font-weight: bold;">💧 <span id="total-water">0</span>g  &nbsp;|&nbsp;  ⏱️ <span id="total-time">0:00</span></span>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="button" onclick="renderRecipeList()" style="flex: 1; padding: 15px; background-color: transparent; color: #d32f2f; border: 2px solid #d32f2f; border-radius: 50px; font-weight: bold; cursor: pointer; font-size: 16px;">Cancelar</button>
                <button type="submit" style="flex: 1.5; padding: 15px; background-color: #2c1e16; color: white; border: none; border-radius: 50px; font-weight: bold; cursor: pointer; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">${btnText}</button>
            </div>
        </form>
    `;
    
    phaseCount = 0;
    
    if (isEditing && recipeToEdit.steps) {
        recipeToEdit.steps.forEach(step => {
            addPhase(step.type, step.targetWater, step.duration);
        });
    }
}

// ==========================================
// 6. LÓGICA DE FASES Y GUARDADO (Actualizada)
// ==========================================
function addPhase(type, initialWater = '', initialTime = '') {
    phaseCount++;
    const container = document.getElementById('phases-container');
    const isVertido = type === 'vertido';
    
    // Colores según el tipo de fase
    const bgColor = isVertido ? '#e3f2fd' : '#fff3e0';
    const borderColor = isVertido ? '#bbdefb' : '#ffe0b2';
    
    // Si es espera, ocultamos la caja de agua, pero mantenemos la estructura
    const waterDisplay = isVertido ? 'flex' : 'none';

    // Inyectamos el HTML de la fase. 
    // NOTA: Hemos añadido 'width: 100%; max-width: 300px; margin: 0 auto;' al contenedor principal
    // para que sea idéntico a los inputs del formulario y no se estire.
    container.insertAdjacentHTML('beforeend', `
        <div class="phase-item" style="border: 1px solid ${borderColor}; padding: 15px; background-color: ${bgColor}; border-radius: 8px; width: 100%; max-width: 300px; margin: 0 auto; box-sizing: border-box;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <p style="margin: 0; font-weight: bold; color: #333;">${isVertido ? '💧 Vertido' : '⏳ Espera'}</p>
                <button type="button" onclick="this.parentElement.parentElement.remove(); updateTotals();" style="background: none; border: none; color: #f44336; cursor: pointer; font-weight: bold; font-size: 14px;">❌ </button>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <div style="flex: 1; display: ${waterDisplay}; flex-direction: column; gap: 5px;">
                    <label style="font-size: 13px;"><b>Agua (g):</b></label>
                    <input type="number" class="phase-water" placeholder="0" value="${initialWater}" min="0" oninput="updateTotals()" ${isVertido ? 'required' : ''} style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; font-family: inherit;">
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; gap: 5px;">
                    <label style="font-size: 13px;"><b>Tiempo (s):</b></label>
                    <input type="number" class="phase-time" placeholder="0" value="${initialTime}" min="0" oninput="updateTotals()" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; font-family: inherit;">
                </div>
            </div>
            
            <input type="hidden" class="phase-type" value="${type}">
        </div>
    `);
    
    updateTotals(); 
}

function updateTotals() {
    let totalWater = 0, totalTime = 0;
    document.querySelectorAll('.phase-water').forEach(input => {
        if (input.parentElement.style.display !== 'none') totalWater += parseInt(input.value) || 0;
    });
    document.querySelectorAll('.phase-time').forEach(input => totalTime += parseInt(input.value) || 0);

    const m = Math.floor(totalTime / 60);
    const s = (totalTime % 60).toString().padStart(2, '0');
    document.getElementById('total-water').innerText = totalWater;
    document.getElementById('total-time').innerText = `${m}:${s}`;
}

function saveRecipe(event) {
    event.preventDefault();
    const steps = [];
    document.querySelectorAll('.phase-item').forEach(item => {
        const type = item.querySelector('.phase-type').value;
        const time = parseInt(item.querySelector('.phase-time').value) || 0;
        const water = type === 'espera' ? 0 : (parseInt(item.querySelector('.phase-water').value) || 0);
        steps.push({ name: type === 'vertido' ? 'Vertido' : 'Espera', targetWater: water, duration: time, type: type });
    });

    const editId = document.getElementById('r-id').value; 
    const newRecipe = {
        id: editId || ('custom-' + Date.now()),
        name: document.getElementById('r-name').value, method: document.getElementById('r-method').value,
        coffee: parseInt(document.getElementById('r-coffee').value), water: parseInt(document.getElementById('r-water').value),
        temp: parseInt(document.getElementById('r-temp').value) || null, grind: document.getElementById('r-grind').value || '',
        roast: document.getElementById('r-roast').value || '', 
        ratio: document.getElementById('r-ratio').value || '', // <- EL ÚNICO CAMBIO ES ESTA LÍNEA
        steps: steps
    };

    let savedRecipes = JSON.parse(localStorage.getItem('myCoffeeRecipes')) || [];
    if (editId) {
        const index = savedRecipes.findIndex(r => r.id === editId);
        if (index !== -1) savedRecipes[index] = newRecipe;
        showToast("✅ Receta actualizada");
    } else {
        savedRecipes.push(newRecipe);
        showToast("✅ Receta creada");
    }
    localStorage.setItem('myCoffeeRecipes', JSON.stringify(savedRecipes));
    renderRecipeList();
}

// ==========================================
// 7. MOTOR DEL INTERVALÓMETRO Y WAKE LOCK
// ==========================================
let audioCtx = null;
function playBeep() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    gain.gain.setValueAtTime(1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.5);
}

let timerInterval = null, countdownInterval = null; 
let isCountingDown = false, isPaused = true;
let currentRecipe = null, currentStepIndex = 0;
let timeRemaining = 0, totalStepDuration = 0, totalWaterAccumulated = 0;
let exactMsRemaining = 0; // NUEVO: Usamos milisegundos para una línea ultra-fluida

const RADIUS = 130, CIRCUMFERENCE = 2 * Math.PI * RADIUS;
let wakeLock = null;

async function requestWakeLock() {
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } 
    catch (err) { console.error("WakeLock error"); }
}
function releaseWakeLock() {
    if (wakeLock !== null) wakeLock.release().then(() => wakeLock = null);
}
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') requestWakeLock();
});

function formatTime(sec) {
    return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
}

// ==========================================
// 8. PANTALLA DE PREPARACIÓN
// ==========================================
function iniciarPreparacion(recipeId) {
    currentRecipe = getAllRecipes().find(r => r.id === recipeId);
    if (!currentRecipe || !currentRecipe.steps || currentRecipe.steps.length === 0) return showToast("⚠️ Sin fases");
    currentStepIndex = 0; isPaused = true; isCountingDown = false;
    clearInterval(countdownInterval); clearInterval(timerInterval);
    
    let tempW = 0;
    currentRecipe.steps.forEach(step => step.accumulatedWater = (tempW += step.targetWater));
    totalStepDuration = timeRemaining = currentRecipe.steps[0].duration;
    exactMsRemaining = totalStepDuration * 1000; // Iniciamos el contador en milisegundos
    
    renderTimerScreen();
}

function renderTimerScreen() {
    const appContent = document.getElementById('app-content');
    const step = currentRecipe.steps[currentStepIndex];
    const isVertido = step.type === 'vertido';
    const progressColor = isVertido ? '#1565c0' : '#e65100';
    const trackColor = isVertido ? '#e3f2fd' : '#fff3e0';
    
    let nextStepHtml = currentStepIndex < currentRecipe.steps.length - 1 
        ? `Siguiente: ${currentRecipe.steps[currentStepIndex + 1].name}` : `Último paso`;

    appContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            
            <button onclick="stopTimer()" style="
                width: 40px; 
                height: 40px; 
                background: none; 
                border: none; 
                padding: 0; 
                cursor: pointer; 
                display: flex; 
                align-items: center; 
                justify-content: center;
            ">
                <img src="volver.png" alt="Volver" style="
                    width: 100%; 
                    height: 100%; 
                    object-fit: contain; 
                ">
            </button>
            
            <h2 style="margin: 0; font-size: 20px;">${currentRecipe.name}</h2>
            <div style="width: 40px;"></div>
        </div>

        <div style="position: relative; width: 280px; height: 280px; margin: 0 auto 30px auto;">
            <svg width="280" height="280" viewBox="0 0 280 280" style="display: block;">
                <circle cx="140" cy="140" r="${RADIUS}" stroke="${trackColor}" stroke-width="4" fill="none" />
                <circle id="progress-ring" cx="140" cy="140" r="${RADIUS}" stroke="${progressColor}" stroke-width="8" fill="none" stroke-linecap="round" transform="rotate(-90 140 140)" style="stroke-dasharray: ${CIRCUMFERENCE}; stroke-dashoffset: 0;" />
            </svg>
            
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                <h3 style="margin: 0 0 8px 0; color: ${progressColor}; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Paso ${currentStepIndex + 1}: ${step.name}</h3>
                
                <div style="margin-bottom: 8px;">
                    <span style="font-size: 12px; color: #666; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Objetivo Báscula</span><br>
                    <span style="font-size: 52px; font-weight: bold; line-height: 1.1; color: #2c1e16;">${step.accumulatedWater}g</span>
                </div>
                
                <div style="font-size: 20px; font-weight: bold; color: #666; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 5px;">
                    ⏱️ <span id="timer-display">${formatTime(timeRemaining)}</span>
                </div>
                
                <p style="font-size: 16px; font-weight: bold; margin: 0; color: ${progressColor};">${isVertido ? `Vierte ${step.targetWater}g` : `Espera...`}</p>
            </div>
        </div>
        
        <p style="text-align: center; color: #666; font-size: 14px;">${nextStepHtml}</p>

        <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
            <button id="btn-play-pause" onclick="toggleTimer()" style="padding: 15px 40px; font-size: 18px; font-weight: bold; background-color: #4CAF50; color: white; border: none; border-radius: 50px; cursor: pointer; width: 200px; text-transform: uppercase;">INICIAR</button>
            <button onclick="nextStep(true)" style="padding: 15px 20px; font-size: 18px; background-color: #e0e0e0; border: none; border-radius: 50px; cursor: pointer;">⏭ </button>
        </div>
    `;
    
    let initialProgress = 1 - (exactMsRemaining / (totalStepDuration * 1000));
    document.getElementById('progress-ring').style.strokeDashoffset = CIRCUMFERENCE * initialProgress;
}

function toggleTimer() {
    if (isCountingDown) return; 
    const btn = document.getElementById('btn-play-pause');
    const ring = document.getElementById('progress-ring');
    const display = document.getElementById('timer-display');

    if (isPaused) {
        isPaused = false; 
        // CAMBIO 3: Texto PAUSAR sin ícono
        btn.innerHTML = 'PAUSAR'; 
        btn.style.backgroundColor = '#FF9800'; 
        requestWakeLock();
        
        if (currentStepIndex === 0 && exactMsRemaining === totalStepDuration * 1000) {
            isCountingDown = true; let count = 3; display.innerText = count;
            countdownInterval = setInterval(() => {
                if (--count > 0) display.innerText = count;
                else {
                    clearInterval(countdownInterval); isCountingDown = false;
                    display.innerText = formatTime(timeRemaining); playBeep(); startActualTimer(ring, display);
                }
            }, 1000);
        } else startActualTimer(ring, display);
    } else {
        isPaused = true; 
        clearInterval(timerInterval); 
        // CAMBIO 4: Texto REANUDAR sin ícono
        btn.innerHTML = 'REANUDAR'; 
        btn.style.backgroundColor = '#4CAF50'; 
        releaseWakeLock();
    }
}

function startActualTimer(ring, display) {
    let lastTick = Date.now();
    
    timerInterval = setInterval(() => {
        let now = Date.now();
        let delta = now - lastTick; // Cuántos milisegundos exactos pasaron desde el último frame
        lastTick = now;
        
        exactMsRemaining -= delta;
        
        if (exactMsRemaining <= 0) {
            clearInterval(timerInterval);
            exactMsRemaining = 0;
            timeRemaining = 0;
            display.innerText = formatTime(0);
            ring.style.strokeDashoffset = CIRCUMFERENCE; 
            nextStep();
        } else {
            // Actualizar texto en segundos redondeados hacia arriba
            timeRemaining = Math.ceil(exactMsRemaining / 1000);
            display.innerText = formatTime(timeRemaining);
            
            // Renderizar la línea ultra-fluida (60 frames por segundo)
            let progress = 1 - (exactMsRemaining / (totalStepDuration * 1000));
            ring.style.strokeDashoffset = CIRCUMFERENCE * progress;
        }
    }, 16); // 16 ms = ~60 FPS
}

function nextStep(manualSkip = false) {
    clearInterval(timerInterval); clearInterval(countdownInterval);
    isCountingDown = false; isPaused = true; currentStepIndex++;
    if (currentStepIndex >= currentRecipe.steps.length) {
        try { playBeep(); } catch(e){} finishRecipe(); releaseWakeLock();
    } else {
        try { playBeep(); } catch(e){}
        totalStepDuration = timeRemaining = currentRecipe.steps[currentStepIndex].duration;
        exactMsRemaining = totalStepDuration * 1000;
        renderTimerScreen(); if (!manualSkip) toggleTimer();
    }
}

function finishRecipe() {
    document.getElementById('app-content').innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 60px; margin-bottom: 20px;">☕</div>
            <h2>¡Extracción Terminada!</h2>
            <p style="color: #666; margin-bottom: 30px;">Disfruta tu ${currentRecipe.name}.</p>
            <button onclick="stopTimer()" style="padding: 15px 40px; font-size: 18px; background-color: #2c1e16; color: white; border: none; border-radius: 8px; cursor: pointer;">Volver al Menú</button>
        </div>
    `;
}

function stopTimer() {
    clearInterval(timerInterval); clearInterval(countdownInterval);
    isCountingDown = false; isPaused = true; releaseWakeLock(); renderRecipeList();
}

window.onload = () => {
    document.body.addEventListener('click', () => {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }, { once: true });
    renderRecipeList();
};