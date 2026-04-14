function cleanSvgClone(svgElement) {
  const clone = svgElement.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  // Remove selection highlights
  clone.querySelectorAll('[data-selection]').forEach((el) => el.remove());

  // Remove background grid
  clone.querySelectorAll('[data-background]').forEach((el) => el.remove());
  const dotGrid = clone.querySelector('#dotGrid');
  if (dotGrid) dotGrid.remove();

  // Strip Dark Reader attributes and inline styles
  clone.querySelectorAll('*').forEach((el) => {
    // Remove data-darkreader-* attributes
    [...el.attributes].forEach((attr) => {
      if (attr.name.startsWith('data-darkreader')) el.removeAttribute(attr.name);
    });
    // Clean --darkreader-* from inline styles
    if (el.style && el.style.cssText) {
      const cleaned = el.style.cssText
        .split(';')
        .filter((s) => !s.trim().startsWith('--darkreader'))
        .join(';');
      if (cleaned.trim()) {
        el.setAttribute('style', cleaned);
      } else {
        el.removeAttribute('style');
      }
    }
  });

  // Remove cursor: pointer from groups (interactive concern, not for export)
  clone.querySelectorAll('g[style]').forEach((el) => {
    const style = el.getAttribute('style') || '';
    const cleaned = style
      .split(';')
      .filter((s) => !s.trim().startsWith('cursor'))
      .join(';')
      .trim();
    if (cleaned) {
      el.setAttribute('style', cleaned);
    } else {
      el.removeAttribute('style');
    }
  });

  // Ensure SVG <a> elements have both href and xlink:href for max compatibility
  clone.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href') || a.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
    if (href) {
      a.setAttribute('href', href);
      a.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', href);
    }
  });

  return clone;
}

export function exportSVG(svgElement, title) {
  const clone = cleanSvgClone(svgElement);
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(clone);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, `${title || 'process'}.svg`);
}

export function exportPNG(svgElement, title, scale = 2) {
  return new Promise((resolve, reject) => {
    const clone = cleanSvgClone(svgElement);
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(clone);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        downloadBlob(blob, `${title || 'process'}.png`);
        resolve();
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function exportJSON(processData, title) {
  const json = JSON.stringify(processData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, `${title || 'process'}.json`);
}

export function copyJSON(processData) {
  const json = JSON.stringify(processData, null, 2);
  return navigator.clipboard.writeText(json);
}

export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (err) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
