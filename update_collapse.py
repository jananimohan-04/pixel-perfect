# -*- coding: utf-8 -*-
import os

filepath = 'src/routes/_app.documents.index.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure toggleFolderExpand is defined inside DocumentsPage
old_state = '  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});'
new_state = '''  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolderExpand = (id: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };'''

content = content.replace(old_state, new_state)

# Change default folder expansion to CLOSED BY DEFAULT
old_is_expanded = 'const isExpanded = expandedFolders[folder.id] !== false;'
new_is_expanded = 'const isExpanded = !!expandedFolders[folder.id];'

content = content.replace(old_is_expanded, new_is_expanded)

# Update icon dynamically based on isExpanded state
old_folder_icon = '<Folder className="w-4 h-4 text-amber-500 fill-amber-100" />'
new_folder_icon = '{isExpanded ? <FolderOpen className="w-4 h-4 text-amber-500 fill-amber-100" /> : <Folder className="w-4 h-4 text-amber-500 fill-amber-100" />}'

content = content.replace(old_folder_icon, new_folder_icon)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated folder collapse logic in DocumentsPage')
