// Global variables
let notes = JSON.parse(localStorage.getItem('ldrNotes')) || [];
let selectedImages = [];
let heartCount = parseInt(localStorage.getItem('heartCount')) || 0;
let currentMood = null;

// DOM elements
const noteInput = document.getElementById('noteInput');
const charCount = document.getElementById('charCount');
const imageInput = document.getElementById('imageInput');
const imageUploadArea = document.getElementById('imageUploadArea');
const imagePreview = document.getElementById('imagePreview');
const saveNoteBtn = document.getElementById('saveNote');
const clearNoteBtn = document.getElementById('clearNote');
const notesList = document.getElementById('notesList');
const currentDate = document.getElementById('currentDate');
const filterBtns = document.querySelectorAll('.filter-btn');
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const closeModal = document.querySelector('.close');
const heartNudgeBtn = document.getElementById('heartNudge');
const heartCountDisplay = document.getElementById('heartCount');
const moodBtn = document.getElementById('moodBtn');
const moodModal = document.getElementById('moodModal');
const floatingHearts = document.getElementById('floatingHearts');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    updateCurrentDate();
    displayNotes();
    setupEventListeners();
    updateCharacterCount();
    updateHeartCount();
    resetHeartCountIfNewDay();
});

// Event listeners
function setupEventListeners() {
    // Character count
    noteInput.addEventListener('input', updateCharacterCount);
    
    // Image upload
    imageUploadArea.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleImageUpload);
    
    // Drag and drop
    imageUploadArea.addEventListener('dragover', handleDragOver);
    imageUploadArea.addEventListener('drop', handleDrop);
    
    // Buttons
    saveNoteBtn.addEventListener('click', saveNote);
    clearNoteBtn.addEventListener('click', clearNote);
    
    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => filterNotes(btn.dataset.filter));
    });
    
    // Heart nudge button
    heartNudgeBtn.addEventListener('click', sendHeart);
    
    // Mood button
    moodBtn.addEventListener('click', openMoodModal);
    
    // Mood options
    document.querySelectorAll('.mood-option').forEach(option => {
        option.addEventListener('click', (e) => selectMood(e.target.dataset.mood));
    });
    
    // Modals
    closeModal.addEventListener('click', closeImageModal);
    imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal) closeImageModal();
    });
    
    // Close mood modal
    moodModal.addEventListener('click', (e) => {
        if (e.target === moodModal || e.target.classList.contains('close')) {
            closeMoodModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Update current date display
function updateCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    currentDate.textContent = now.toLocaleDateString('en-US', options);
}

// Update character count
function updateCharacterCount() {
    const count = noteInput.value.length;
    charCount.textContent = count;
    
    if (count > 1800) {
        charCount.style.color = '#e74c3c';
    } else if (count > 1500) {
        charCount.style.color = '#f39c12';
    } else {
        charCount.style.color = '#666';
    }
}

// Handle image upload
function handleImageUpload(event) {
    const files = Array.from(event.target.files);
    processImages(files);
}

// Handle drag and drop
function handleDragOver(event) {
    event.preventDefault();
    imageUploadArea.style.background = '#f0f2ff';
}

function handleDrop(event) {
    event.preventDefault();
    imageUploadArea.style.background = '#f8f9ff';
    
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    processImages(imageFiles);
}

// Process uploaded images
function processImages(files) {
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = {
                    id: Date.now() + Math.random(),
                    data: e.target.result,
                    name: file.name,
                    size: file.size
                };
                selectedImages.push(imageData);
                displaySelectedImages();
            };
            reader.readAsDataURL(file);
        }
    });
}

// Display selected images
function displaySelectedImages() {
    imagePreview.innerHTML = '';
    selectedImages.forEach(image => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'image-item';
        imgContainer.innerHTML = `
            <img src="${image.data}" alt="${image.name}" onclick="openImageModal('${image.data}')">
            <button class="remove-image" onclick="removeImage('${image.id}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        imagePreview.appendChild(imgContainer);
    });
}

// Remove image
function removeImage(imageId) {
    selectedImages = selectedImages.filter(img => img.id !== imageId);
    displaySelectedImages();
}

// Open image modal
function openImageModal(imageSrc) {
    modalImage.src = imageSrc;
    imageModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close image modal
function closeImageModal() {
    imageModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Save note
function saveNote() {
    const content = noteInput.value.trim();
    
    if (!content && selectedImages.length === 0) {
        showNotification('Please write a note or add some photos!', 'warning');
        return;
    }
    
    const note = {
        id: Date.now(),
        content: content,
        images: [...selectedImages],
        date: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    notes.unshift(note); // Add to beginning
    localStorage.setItem('ldrNotes', JSON.stringify(notes));
    
    // Clear form
    noteInput.value = '';
    selectedImages = [];
    imagePreview.innerHTML = '';
    updateCharacterCount();
    
    // Refresh display
    displayNotes();
    showNotification('Note saved successfully! 💕', 'success');
}

// Clear note
function clearNote() {
    if (noteInput.value.trim() || selectedImages.length > 0) {
        if (confirm('Are you sure you want to clear this note?')) {
            noteInput.value = '';
            selectedImages = [];
            imagePreview.innerHTML = '';
            updateCharacterCount();
            showNotification('Note cleared', 'info');
        }
    }
}

// Display notes
function displayNotes(filter = 'all') {
    let filteredNotes = notes;
    
    if (filter === 'today') {
        const today = new Date().toDateString();
        filteredNotes = notes.filter(note => 
            new Date(note.date).toDateString() === today
        );
    } else if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filteredNotes = notes.filter(note => 
            new Date(note.date) >= weekAgo
        );
    }
    
    if (filteredNotes.length === 0) {
        notesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <p>No notes yet. Start sharing your day! 💕</p>
            </div>
        `;
        return;
    }
    
    notesList.innerHTML = filteredNotes.map(note => createNoteHTML(note)).join('');
}

// Create note HTML
function createNoteHTML(note) {
    const noteDate = new Date(note.date);
    const timeString = noteDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    const dateString = noteDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: noteDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
    
    const imagesHTML = note.images.length > 0 ? `
        <div class="note-images">
            ${note.images.map(img => 
                `<img src="${img.data}" alt="${img.name}" onclick="openImageModal('${img.data}')">`
            ).join('')}
        </div>
    ` : '';
    
    return `
        <div class="note-item">
            <div class="note-meta">
                <span class="note-date">${dateString} at ${timeString}</span>
                <button class="delete-note" onclick="deleteNote(${note.id})" title="Delete note">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="note-content">${note.content || '<em>No text content</em>'}</div>
            ${imagesHTML}
        </div>
    `;
}

// Delete note
function deleteNote(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
        notes = notes.filter(note => note.id !== noteId);
        localStorage.setItem('ldrNotes', JSON.stringify(notes));
        displayNotes();
        showNotification('Note deleted', 'info');
    }
}

// Filter notes
function filterNotes(filter) {
    // Update active button
    filterBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    displayNotes(filter);
}

// Keyboard shortcuts
function handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + S to save
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveNote();
    }
    
    // Ctrl/Cmd + K to clear
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        clearNote();
    }
    
    // Escape to close modal
    if (event.key === 'Escape') {
        closeImageModal();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'warning' ? '#f39c12' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
}

// Heart nudge functionality
function sendHeart() {
    heartCount++;
    localStorage.setItem('heartCount', heartCount.toString());
    updateHeartCount();
    createFloatingHearts();
    showNotification('Heart sent! 💕', 'success');
    
    // Add some bounce animation to the button
    heartNudgeBtn.style.transform = 'scale(1.2)';
    setTimeout(() => {
        heartNudgeBtn.style.transform = '';
    }, 200);
}

function updateHeartCount() {
    heartCountDisplay.textContent = heartCount;
}

function resetHeartCountIfNewDay() {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('lastHeartReset');
    
    if (lastReset !== today) {
        heartCount = 0;
        localStorage.setItem('heartCount', '0');
        localStorage.setItem('lastHeartReset', today);
        updateHeartCount();
    }
}

function createFloatingHearts() {
    const heartCount = 5;
    for (let i = 0; i < heartCount; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.className = 'floating-heart';
            heart.innerHTML = '💕';
            heart.style.left = Math.random() * 100 + '%';
            heart.style.top = '100%';
            floatingHearts.appendChild(heart);
            
            setTimeout(() => {
                heart.remove();
            }, 3000);
        }, i * 100);
    }
}

// Mood functionality
function openMoodModal() {
    moodModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeMoodModal() {
    moodModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function selectMood(mood) {
    currentMood = mood;
    closeMoodModal();
    showNotification(`Mood set to ${mood}`, 'success');
    
    // Update mood button to show selected mood
    moodBtn.innerHTML = `<i class="fas fa-smile"></i> ${mood} Mood`;
}

// Update save note function to include mood
function saveNote() {
    const content = noteInput.value.trim();
    
    if (!content && selectedImages.length === 0) {
        showNotification('Please write a note or add some photos!', 'warning');
        return;
    }
    
    const note = {
        id: Date.now(),
        content: content,
        images: [...selectedImages],
        mood: currentMood,
        date: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    notes.unshift(note); // Add to beginning
    localStorage.setItem('ldrNotes', JSON.stringify(notes));
    
    // Clear form
    noteInput.value = '';
    selectedImages = [];
    currentMood = null;
    imagePreview.innerHTML = '';
    moodBtn.innerHTML = '<i class="fas fa-smile"></i> Add Mood';
    updateCharacterCount();
    
    // Refresh display
    displayNotes();
    showNotification('Note saved successfully! 💕', 'success');
}

// Update createNoteHTML function to include mood
function createNoteHTML(note) {
    const noteDate = new Date(note.date);
    const timeString = noteDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    const dateString = noteDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: noteDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
    
    const imagesHTML = note.images.length > 0 ? `
        <div class="note-images">
            ${note.images.map(img => 
                `<img src="${img.data}" alt="${img.name}" onclick="openImageModal('${img.data}')">`
            ).join('')}
        </div>
    ` : '';
    
    const moodHTML = note.mood ? `<span class="note-mood">${note.mood}</span>` : '';
    
    return `
        <div class="note-item">
            <div class="note-meta">
                <span class="note-date">${dateString} at ${timeString}${moodHTML}</span>
                <button class="delete-note" onclick="deleteNote(${note.id})" title="Delete note">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="note-content">${note.content || '<em>No text content</em>'}</div>
            ${imagesHTML}
        </div>
    `;
}
