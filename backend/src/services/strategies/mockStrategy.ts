import { ExtractionStrategy, ExtractionResult } from './strategyTypes';

export class MockStrategy implements ExtractionStrategy {
  public name = 'MockFallback';

  public async run(url: string): Promise<ExtractionResult> {
    const cleanUrl = url.toLowerCase();
    
    // Simulate slight delay to make the loader feel realistic
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (cleanUrl.includes('instagram.com')) {
      return {
        platform: 'Instagram',
        title: 'Exploring Tokyo under the rain. Cyberpunk reflections and futuristic details 🌧️✨ #tokyo #neon #cyberpunk',
        authorName: 'cyber_traveler',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
        likeCount: 12450,
        commentCount: 840,
        media: [
          {
            id: 'ig-1',
            type: 'image',
            thumbnailUrl: '/static/media_cyberpunk.png',
            downloadUrl: '/static/media_cyberpunk.png',
            size: 2.1,
            filename: 'media_cyberpunk.png'
          },
          {
            id: 'ig-2',
            type: 'video',
            thumbnailUrl: '/static/media_car.png',
            downloadUrl: '/static/media_car.png',
            size: 14.2,
            filename: 'media_car.png'
          },
          {
            id: 'ig-3',
            type: 'image',
            thumbnailUrl: '/static/media_abstract.png',
            downloadUrl: '/static/media_abstract.png',
            size: 1.8,
            filename: 'media_abstract.png'
          },
          {
            id: 'ig-4',
            type: 'image',
            thumbnailUrl: '/static/media_portrait.png',
            downloadUrl: '/static/media_portrait.png',
            size: 3.2,
            filename: 'media_portrait.png'
          }
        ]
      };
    } else if (cleanUrl.includes('tiktok.com')) {
      return {
        platform: 'TikTok',
        title: 'New hypercar rendering concept complete. Check out the neon tail lights! 🏎️⚡ #3d #blender #automotive',
        authorName: 'supercar_renders',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
        likeCount: 38200,
        commentCount: 1420,
        media: [
          {
            id: 'tt-1',
            type: 'video',
            thumbnailUrl: '/static/media_car.png',
            downloadUrl: '/static/media_car.png',
            size: 18.5,
            filename: 'media_car.png'
          },
          {
            id: 'tt-2',
            type: 'image',
            thumbnailUrl: '/static/media_portrait.png',
            downloadUrl: '/static/media_portrait.png',
            size: 2.8,
            filename: 'media_portrait.png'
          }
        ]
      };
    } else {
      // Facebook
      return {
        platform: 'Facebook',
        title: 'Sharing some design projects from the past month. Really enjoyed working on abstract shapes and lighting layers. 📐💡',
        authorName: 'retro_designs_studio',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
        likeCount: 1450,
        commentCount: 95,
        media: [
          {
            id: 'fb-1',
            type: 'image',
            thumbnailUrl: '/static/media_abstract.png',
            downloadUrl: '/static/media_abstract.png',
            size: 1.5,
            filename: 'media_abstract.png'
          },
          {
            id: 'fb-2',
            type: 'video',
            thumbnailUrl: '/static/media_car.png',
            downloadUrl: '/static/media_car.png',
            size: 12.8,
            filename: 'media_car.png'
          },
          {
            id: 'fb-3',
            type: 'image',
            thumbnailUrl: '/static/media_portrait.png',
            downloadUrl: '/static/media_portrait.png',
            size: 2.9,
            filename: 'media_portrait.png'
          }
        ]
      };
    }
  }
}
