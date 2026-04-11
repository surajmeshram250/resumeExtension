# Editable Resume Builder

A lightweight browser-based resume editor that lets you edit content directly, switch between templates, adjust typography and spacing, and export the final resume as PDF.

## Features

- Inline editing for resume content
- Classic and Alternate resume templates
- Toolbar controls for:
  - Font family
  - Font size
  - Line height
  - Section spacing
  - Text color
  - Accent color
- Add and remove:
  - Work experience entries
  - Project entries
  - Education entries
  - Skill items
  - Bullet points
- Print-friendly PDF export
- Local auto-save using browser storage

## Project Structure

```text
resume-project/
├── resume.html
├── style.css
└── resume.js
```

## How to Use

1. Place `resume.html`, `style.css`, and `resume.js` in the same folder.
2. Open `resume.html` in Chrome or any modern browser.
3. Click **Edit** to start modifying the content.
4. Use the toolbar to switch templates and adjust styling.
5. Click **Save** to persist your changes locally.
6. Click **Download PDF** to print or save the resume as a PDF.

## Toolbar Controls

- **Template**: Switch between Classic and Alternate layouts.
- **Font**: Change the resume font.
- **Size**: Increase or decrease text size.
- **Line Height**: Adjust vertical text spacing.
- **Spacing**: Control spacing between sections.
- **Text**: Change the main text color.
- **Accent**: Change header and section accent colors.

## Editing Support

When edit mode is enabled, the resume supports dynamic controls for adding and removing content blocks.

You can add:
- New project entries
- New work experience entries
- New education entries
- New skill chips
- New bullet points under work and projects

## PDF Export

The page includes print-specific styles so the toolbar and edit controls are hidden during PDF export.

For best results:
- Open the file in Chrome
- Click **Download PDF**
- Choose **Save as PDF** in the print dialog
- Use default scale or adjust based on your content length

## Notes

- Changes are stored in `localStorage`, so they remain available in the same browser.
- If old saved data causes layout issues, clear it with:

```js
localStorage.clear();
location.reload();
```

## Customization

This project can be extended with:
- Additional templates
- Multiple page support
- Theme presets
- Section reordering
- JSON import/export
- Cloud save integration

## License

Use freely for personal, academic, or portfolio purposes.
