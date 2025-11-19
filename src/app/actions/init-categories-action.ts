'use server';

import 'firebase-admin/app';
import 'firebase-admin/firestore';
// Import admin config to initialize the SDK
import '@/lib/firebase/admin-config';
import { batchSetCategoryConfigs } from '@/lib/firebase/category-config-service-admin';
import { CATEGORIES } from '@/lib/categories';

export async function initializeCategoriesAction() {
  try {
    console.log('🚀 Starting to initialize categories in Firebase...');
    
    const categoryConfigs = CATEGORIES.map((fullCategoryName, index) => {
      // Extract emoji and name
      const emojiMatch = fullCategoryName.match(/^(.)+ /);
      const emoji = emojiMatch ? emojiMatch[0].trim() : '🍽️';
      const nameWithoutEmoji = fullCategoryName.replace(/^.+?\s+/, '').trim();
      const categoryId = nameWithoutEmoji
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[ü]/g, 'ue')
        .replace(/[ö]/g, 'oe')
        .replace(/[ä]/g, 'ae')
        .replace(/[^a-z0-9-]/g, '');

      return {
        id: categoryId,
        fullName: fullCategoryName,
        emoji,
        nameWithoutEmoji,
        order: index,
      };
    });

    let successCount = 0;
    let errorCount = 0;
    const results = [];
    const batchConfigs = [];

    for (const config of categoryConfigs) {
      try {
        batchConfigs.push({
          id: config.id,
          config: {
            order: config.order,
            emoji: config.emoji,
            name: config.fullName,
            description: `${config.emoji} ${config.nameWithoutEmoji}`,
          },
        });
      } catch (error) {
        console.error(`❌ Failed to prepare ${config.fullName}:`, error);
        results.push({
          status: 'error',
          category: config.fullName,
          id: config.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        errorCount++;
      }
    }

    try {
      await batchSetCategoryConfigs(batchConfigs);
      successCount = batchConfigs.length;
      for (const config of categoryConfigs) {
        console.log(`✅ ${config.order + 1}. ${config.fullName}`);
        results.push({
          status: 'success',
          category: config.fullName,
          id: config.id,
        });
      }
    } catch (error) {
      console.error('❌ Failed to batch set categories:', error);
      throw error;
    }

    const summary = {
      success: successCount,
      failed: errorCount,
      total: CATEGORIES.length,
      results,
    };

    console.log(`\n📊 Summary:`);
    console.log(`✅ Successfully added: ${successCount} categories`);
    console.log(`❌ Failed: ${errorCount} categories`);
    console.log(`📁 Total: ${CATEGORIES.length} categories`);

    return {
      success: errorCount === 0,
      message: errorCount === 0 ? 'All categories initialized successfully' : 'Some categories failed to initialize',
      summary,
    };
  } catch (error) {
    console.error('Error initializing categories:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
