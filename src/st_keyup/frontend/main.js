function onKeyUp(event) {
  // Update the component value
  Streamlit.setComponentValue(event.target.value)

  // Adjust height based on content
  autoResizeTextarea(event.target)
}

// Function to auto-resize textarea based on content
// Function to auto-resize textarea based on content
// Function to auto-resize textarea based on content
function autoResizeTextarea(textarea) {
  // Store the original height if we haven't yet
  if (!textarea.dataset.originalHeight) {
    textarea.dataset.originalHeight = textarea.clientHeight;
  }

  // Get the current line height from computed styles
  const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight) || 24; // Default if can't get computed
  const originalHeight = parseInt(textarea.dataset.originalHeight);
  const maxHeight = parseInt(window.getComputedStyle(textarea).maxHeight);

  // Get the current content's height using a hidden clone with the same width and content
  const clone = document.createElement('textarea');
  clone.style.visibility = 'hidden';
  clone.style.position = 'absolute';
  clone.style.height = 'auto';
  clone.style.width = textarea.clientWidth + 'px';
  clone.style.padding = window.getComputedStyle(textarea).padding;
  clone.style.border = window.getComputedStyle(textarea).border;
  clone.style.boxSizing = window.getComputedStyle(textarea).boxSizing;
  clone.style.lineHeight = window.getComputedStyle(textarea).lineHeight;
  clone.style.overflow = 'hidden';
  clone.value = textarea.value;

  document.body.appendChild(clone);
  const scrollHeight = clone.scrollHeight;
  document.body.removeChild(clone);

  // Check if text has actual line breaks that require more height
  const textLines = textarea.value.split('\n').length;
  const visibleLines = Math.floor(originalHeight / lineHeight);

  // Only resize if content needs more lines than originally available
  let newHeight;

  if (textLines > visibleLines || scrollHeight > originalHeight) {
    // Content exceeds original height, so resize (with a small buffer)
    newHeight = Math.min(scrollHeight + 5, maxHeight);
  } else {
    // Content fits within original height, keep original size
    newHeight = originalHeight;
  }

  textarea.style.height = `${newHeight}px`;

  // Update the frame height to accommodate the textarea
  const frameHeight = (newHeight < maxHeight) ? newHeight + 35 : maxHeight + 35;
  Streamlit.setFrameHeight(frameHeight);
}

const debounce = (callback, wait) => {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback.apply(null, args);
    }, wait);
  };
}

/**
 * The component's render function. This will be called immediately after
 * the component is initially loaded, and then again every time the
 * component gets new data from Python.
 */
function onRender(event) {
  // Get the RenderData from the event
  // This is called on every render to allow changing themes via settings
  const root = document.getElementById("root")
  root.style.setProperty("--base", event.detail.theme.base)
  root.style.setProperty("--primary-color", event.detail.theme.primaryColor)
  root.style.setProperty("--background-color", event.detail.theme.backgroundColor)
  root.style.setProperty("--secondary-background-color", event.detail.theme.secondaryBackgroundColor)
  root.style.setProperty("--text-color", event.detail.theme.textColor)
  root.style.setProperty("--font", event.detail.theme.font)

  if (!window.rendered) {
    const {
      label,
      value,
      debounce: debounce_time,
      max_chars,
      type,
      placeholder,
      disabled,
      label_visibility,
      height = 50 // Default height
    } = event.detail.args;

    const input = document.getElementById("input_box");
    const label_el = document.getElementById("label")

    if (label_el) {
      label_el.innerText = label
    }

    // Store the original height
    input.dataset.originalHeight = height;

    if (value) {
      input.value = value
      // Force correct height calculation immediately
      input.style.height = 'auto';
      const contentHeight = Math.min(input.scrollHeight + 5, parseInt(window.getComputedStyle(input).maxHeight));
      input.style.height = `${contentHeight}px`;
      Streamlit.setFrameHeight(contentHeight + 35);
    } else {
      // No initial value, use the specified height
      input.style.height = `${height}px`;
      // Set frame height immediately and precisely
      Streamlit.setFrameHeight(height + 35);
    }

    if (max_chars) {
      input.maxLength = max_chars
    }

    if (placeholder) {
      input.placeholder = placeholder
    }

    if (disabled) {
      input.disabled = true
      // Add "disabled" class to root element
      root.classList.add("disabled")
    }

    if (label_visibility == "hidden") {
      root.classList.add("label-hidden")
    }
    else if (label_visibility == "collapsed") {
      root.classList.add("label-collapsed")
      // Adjust frame height for collapsed label
      Streamlit.setFrameHeight(height + 10);
    }

    // Setup events
    if (debounce_time > 0) { // is false if debounce_time is 0 or undefined
      input.oninput = debounce(onKeyUp, debounce_time)
    }
    else {
      input.oninput = onKeyUp
    }

    // Add input event for auto-resize
    input.addEventListener('input', function () {
      autoResizeTextarea(this)
    });

    // Force correct initial frame height
    setTimeout(() => {
      const actualHeight = label_visibility == "collapsed" ? height + 10 : height + 35;
      Streamlit.setFrameHeight(actualHeight);
    }, 0);

    window.rendered = true
  }
}

Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRender)
Streamlit.setComponentReady()