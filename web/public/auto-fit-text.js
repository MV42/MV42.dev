/**
 * AutoFitText - Version ultra-optimisée pour ajustement fluide de police
 */
class AutoFitText {    constructor(selector = '.auto-fit-text-js', {precision = 0.0001} = {}) {
        this.precision = precision;
        this.cache = new Map();
        this.canvas = document.createElement('canvas').getContext('2d');
        
        const elements = document.querySelectorAll(selector);
        const observer = new ResizeObserver(entries => 
            entries.forEach(({target}) => this.adjust(target))
        );
        
        elements.forEach(el => {
            observer.observe(el);
            this.adjust(el);
        });
        
        this.observer = observer;
    }
    
    adjust(el) {
        const width = this.getWidth(el);
        const text = el.textContent;
        const font = getComputedStyle(el).fontFamily;
        const key = `${text}_${width}_${font}`;
        
        if (this.cache.has(key)) {
            el.style.fontSize = this.cache.get(key) + 'px';
            return;
        }
        
        const size = this.findSize(text, font, width);
        this.cache.set(key, size);
        el.style.fontSize = size + 'px';
    }      getWidth(el) {
        // Utiliser la largeur réelle de l'élément après application du CSS
        const computedStyle = getComputedStyle(el);
        const elementWidth = el.getBoundingClientRect().width;
        
        // Soustraire padding et border pour obtenir la largeur réelle disponible pour le texte
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
        const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
        const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;
        
        // Ajouter une marge de sécurité plus importante pour éviter les débordements
        const availableWidth = elementWidth - paddingLeft - paddingRight - borderLeft - borderRight;
        const safeWidth = availableWidth * 0.95; // 5% de marge de sécurité au lieu de 2%
        
        return Math.max(1, safeWidth);
    }findSize(text, font, width) {
        // Calcul direct optimal avec Newton-Raphson
        this.canvas.font = `1px ${font}`;
        const baseWidth = this.canvas.measureText(text).width;
        
        if (baseWidth <= 0 || width <= 0) return 0.001;
        
        // Estimation initiale optimisée
        let size = width / baseWidth;
        
        // Newton-Raphson pour convergence ultra-rapide
        for (let i = 0; i < 5; i++) {
            this.canvas.font = `${size}px ${font}`;
            const currentWidth = this.canvas.measureText(text).width;
            const error = currentWidth - width;
            
            if (Math.abs(error) < this.precision) break;
            
            // Dérivée approximée et correction
            const delta = size * 0.001;
            this.canvas.font = `${size + delta}px ${font}`;
            const nextWidth = this.canvas.measureText(text).width;
            const derivative = (nextWidth - currentWidth) / delta;
            
            if (derivative > 0) size -= error / derivative;
              // Empêcher les tailles négatives mais permettre très très petit
            size = Math.max(0.001, size);        }
        
        // Vérification finale anti-débordement plus stricte
        this.canvas.font = `${size}px ${font}`;
        while (this.canvas.measureText(text).width > width && size > 0.001) {
            size *= 0.95; // Réduction plus agressive
            this.canvas.font = `${size}px ${font}`;
        }
        
        // Double vérification avec une réduction supplémentaire
        if (this.canvas.measureText(text).width > width * 0.98) {
            size *= 0.9;
        }
        
        return size;
    }
    
    destroy() { this.observer?.disconnect(); }
    addElement(el) { this.observer.observe(el); this.adjust(el); }
}

// Fonction utilitaire et auto-initialisation
const autoFitText = (selector, options) => new AutoFitText(selector, options);

// Auto-init avec gestion optimisée du DOM
(document.readyState === 'loading' ? 
    new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve)) : 
    Promise.resolve()
).then(() => new AutoFitText());

// Export module
typeof module !== 'undefined' && (module.exports = { AutoFitText, autoFitText });
