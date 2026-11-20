#!/usr/bin/env python3
"""
Fix duplicate models and enums in Prisma schema.
Keeps the first complete definition and removes subsequent duplicates.
"""

import re
import sys

def parse_schema(content):
    """Parse schema and find all model/enum definitions with their line ranges."""
    lines = content.split('\n')
    definitions = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check for model or enum definition
        model_match = re.match(r'^(model|enum)\s+(\w+)\s*\{', line)
        if model_match:
            def_type = model_match.group(1)
            name = model_match.group(2)
            start_line = i
            
            # Find the closing brace
            brace_count = 1
            i += 1
            while i < len(lines) and brace_count > 0:
                if '{' in lines[i]:
                    brace_count += lines[i].count('{')
                if '}' in lines[i]:
                    brace_count -= lines[i].count('}')
                i += 1
            
            end_line = i - 1
            content_lines = end_line - start_line + 1
            
            definitions.append({
                'type': def_type,
                'name': name,
                'start': start_line,
                'end': end_line,
                'lines': content_lines
            })
        else:
            i += 1
    
    return lines, definitions

def find_duplicates(definitions):
    """Find duplicate definitions (same type and name)."""
    seen = {}
    duplicates = []
    
    for defn in definitions:
        key = (defn['type'], defn['name'])
        if key in seen:
            # This is a duplicate
            prev = seen[key]
            # Keep the one with more lines (more complete)
            if defn['lines'] > prev['lines']:
                # New one is more complete, mark old one as duplicate
                duplicates.append(prev)
                seen[key] = defn
            else:
                # Old one is more complete or equal, mark new one as duplicate
                duplicates.append(defn)
        else:
            seen[key] = defn
    
    return duplicates

def remove_duplicates(lines, duplicates):
    """Remove duplicate definitions from the schema."""
    # Sort duplicates by start line (descending) so we can remove from bottom up
    duplicates_sorted = sorted(duplicates, key=lambda x: x['start'], reverse=True)
    
    for dup in duplicates_sorted:
        print(f"Removing duplicate {dup['type']} {dup['name']} (lines {dup['start']+1}-{dup['end']+1})")
        # Remove the lines (inclusive)
        del lines[dup['start']:dup['end']+1]
        
        # Also remove preceding comment lines if they exist
        # Look for comment lines immediately before this definition
        i = dup['start'] - 1
        while i >= 0 and (lines[i].strip().startswith('//') or lines[i].strip() == ''):
            i -= 1
        # Remove from i+1 to start (but only if there are comment lines)
        if i < dup['start'] - 1:
            comments_start = i + 1
            # Don't delete if we already deleted the main definition
            if comments_start < len(lines):
                pass  # Lines already deleted above
    
    return lines

def main():
    schema_path = 'prisma/schema.prisma'
    
    # Read schema
    with open(schema_path, 'r') as f:
        content = f.read()
    
    # Parse definitions
    lines, definitions = parse_schema(content)
    
    print(f"Found {len(definitions)} model/enum definitions")
    
    # Find duplicates
    duplicates = find_duplicates(definitions)
    
    if not duplicates:
        print("No duplicates found!")
        return 0
    
    print(f"Found {len(duplicates)} duplicates to remove")
    
    # Remove duplicates
    cleaned_lines = remove_duplicates(lines, duplicates)
    
    # Write back
    with open(schema_path, 'w') as f:
        f.write('\n'.join(cleaned_lines))
    
    print(f"Schema cleaned! Removed {len(duplicates)} duplicate definitions")
    print(f"Original: {len(lines)} lines, New: {len(cleaned_lines)} lines")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
