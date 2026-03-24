import { useState, useEffect } from 'react';

export const useRecentPosts = () => {
    const [postIds, setPostIds] = useState<string[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('recent_post_ids');
        if (saved) {
            try {
                setPostIds(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse recent posts", e);
            }
        }
    }, []);

    const addPostId = (id: string) => {
        setPostIds((prev) => {
            // Remove the ID if it already exists (to move it to the top)
            const filtered = prev.filter((existingId) => existingId !== id);
            // Keep the last 5 unique IDs
            const updated = [id, ...filtered].slice(0, 5);
            localStorage.setItem('recent_post_ids', JSON.stringify(updated));
            return updated;
        });
    };

    const clearPosts = () => {
        localStorage.removeItem('recent_post_ids');
        setPostIds([]);
    };

    return { postIds, addPostId, clearPosts };
};