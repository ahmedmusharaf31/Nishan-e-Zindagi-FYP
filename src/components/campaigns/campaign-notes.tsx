'use client';

import { useState } from 'react';
import { CampaignNote } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CampaignNotesProps {
  notes: CampaignNote[];
  onAddNote?: (content: string) => Promise<void>;
  maxHeight?: string;
  className?: string;
  readOnly?: boolean;
}

export function CampaignNotes({
  notes,
  onAddNote,
  maxHeight = '300px',
  className,
  readOnly = false,
}: CampaignNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newNote.trim() || !onAddNote) return;

    setIsSubmitting(true);
    try {
      await onAddNote(newNote.trim());
      setNewNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Notes List */}
      <ScrollArea style={{ maxHeight }} className="pr-4">
        {notes.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No notes yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{note.createdBy}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(note.createdAt)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Add Note Input */}
      {!readOnly && onAddNote && (
        <div className="space-y-2">
          <Textarea
            placeholder="Add a note... (Ctrl+Enter to submit)"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!newNote.trim() || isSubmitting}
            >
              <Send className="w-3 h-3 mr-1" />
              {isSubmitting ? 'Adding...' : 'Add Note'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
