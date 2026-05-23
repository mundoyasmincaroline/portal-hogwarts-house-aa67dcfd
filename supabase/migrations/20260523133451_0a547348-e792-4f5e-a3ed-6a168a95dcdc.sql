-- Create RPC for toggling insta_post likes
CREATE OR REPLACE FUNCTION public.toggle_insta_like(p_post_id UUID, p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    current_likes UUID[];
BEGIN
    -- Get current likes
    SELECT likes INTO current_likes FROM public.insta_posts WHERE id = p_post_id;
    
    -- Check if user already liked
    IF p_user_id = ANY(current_likes) THEN
        -- Remove like
        UPDATE public.insta_posts 
        SET likes = array_remove(current_likes, p_user_id)
        WHERE id = p_post_id;
    ELSE
        -- Add like
        UPDATE public.insta_posts 
        SET likes = array_append(current_likes, p_user_id)
        WHERE id = p_post_id;
        
        -- Optional: Award XP to the post owner (handled in client but could be here too)
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.toggle_insta_like(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_insta_like(UUID, UUID) TO anon;
