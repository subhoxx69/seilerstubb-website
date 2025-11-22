/**
 * Script to initialize all categories in Firebase
 * Run this once to set up all categories with their order and emojis
 */

import { setCategoryConfig } from '@/lib/firebase/category-config-service';
import { CATEGORIES } from '@/lib/categories';

export async function initializeCategoriesInFirebase() {
  console.log('🚀 Starting to initialize categories in Firebase...');
  
  const categoryConfigs = CATEGORIES.map((fullCategoryName, index) => {
    // Extract emoji and name
    const emojiMatch = fullCategoryName.match(/^(.)+ /);
    const emoji = emojiMatch ? emojiMatch[0].trim() : '🍽️';
    const nameWithoutEmoji = fullCategoryName.replace(/^.+?\s+/, '').trim();
    const categoryId = nameWithoutEmoji.toLowerCase().replace(/\s+/g, '-').replace(/[ü]/g, 'ue').replace(/[ö]/g, 'oe').replace(/[ä]/g, 'ae');

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

  for (const config of categoryConfigs) {
    try {
      await setCategoryConfig(config.id, {
        order: config.order,
        emoji: config.emoji,
        name: config.fullName,
        description: `${config.emoji} ${config.nameWithoutEmoji}`,
      });
      console.log(`✅ ${config.order + 1}. ${config.fullName}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to add ${config.fullName}:`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Successfully added: ${successCount} categories`);
  console.log(`❌ Failed: ${errorCount} categories`);
  console.log(`📁 Total: ${CATEGORIES.length} categories`);

  return {
    success: successCount,
    failed: errorCount,
    total: CATEGORIES.length,
  };
}

// Export for testing
export default initializeCategoriesInFirebase;
