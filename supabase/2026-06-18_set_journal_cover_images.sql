-- Set fallback cover images for the five imported scent journal posts.
-- These images already exist in the website repository under /assets/.

update public.posts
set cover_url = case slug
  when 'olfactory-vulgarity-or-artistry' then '/assets/1.png'
  when 'blooming-tears' then '/assets/2.png'
  when 'from-perfume-product-to-scent-branding-system' then '/assets/3.png'
  when 'proust-effect-fragrance-experience' then '/assets/4.png'
  when 'taipei-corporate-fragrance-workshop' then '/assets/5.png'
  else cover_url
end
where slug in (
  'olfactory-vulgarity-or-artistry',
  'blooming-tears',
  'from-perfume-product-to-scent-branding-system',
  'proust-effect-fragrance-experience',
  'taipei-corporate-fragrance-workshop'
);
