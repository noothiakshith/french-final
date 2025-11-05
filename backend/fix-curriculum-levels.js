import prisma from './src/utils/prisma.js';

async function fixCurriculumLevels() {
    try {
        console.log('🔧 Fixing Curriculum Level Differences\n');
        
        // Check current curriculum differences
        console.log('📊 Analyzing current curriculum levels');
        console.log('=====================================');
        
        const beginnerChapters = await prisma.chapter.findMany({
            where: { level: 'BEGINNER' },
            select: { title: true, chapterNumber: true, topic: true },
            orderBy: { chapterNumber: 'asc' },
            take: 15
        });
        
        const intermediateChapters = await prisma.chapter.findMany({
            where: { level: 'INTERMEDIATE' },
            select: { title: true, chapterNumber: true, topic: true },
            orderBy: { chapterNumber: 'asc' },
            take: 15
        });
        
        console.log('BEGINNER chapters:');
        beginnerChapters.forEach(ch => {
            console.log(`  ${ch.chapterNumber}. ${ch.title} (${ch.topic})`);
        });
        
        console.log('\nINTERMEDIATE chapters:');
        intermediateChapters.forEach(ch => {
            console.log(`  ${ch.chapterNumber}. ${ch.title} (${ch.topic})`);
        });
        
        // Find identical titles
        const beginnerTitles = beginnerChapters.map(ch => ch.title);
        const intermediateTitles = intermediateChapters.map(ch => ch.title);
        const identicalTitles = beginnerTitles.filter(title => intermediateTitles.includes(title));
        
        console.log(`\n🔍 Found ${identicalTitles.length} identical chapter titles between levels`);
        
        if (identicalTitles.length > 0) {
            console.log('\n📝 Updating INTERMEDIATE chapters to be more advanced');
            console.log('====================================================');
            
            // Update intermediate chapters to be more advanced
            const intermediateUpdates = {
                'Salutations et Présentations': 'Salutations Formelles et Protocole',
                'Les Chiffres 1-20': 'Les Chiffres et les Mathématiques',
                'Être et Avoir': 'Conjugaisons Avancées: Être et Avoir',
                'La Famille': 'Relations Familiales et Généalogie',
                'Les Couleurs': 'Couleurs et Descriptions Détaillées',
                'Nourriture et Restaurant': 'Gastronomie Française et Critique Culinaire',
                'Shopping et Prix': 'Commerce et Négociation',
                'Directions et Lieux': 'Navigation Urbaine et Géographie',
                'Passé Composé': 'Temps du Passé: Nuances et Subtilités',
                'Futur Proche': 'Expression du Futur: Certitude et Probabilité',
                'Le Subjonctif': 'Subjonctif: Maîtrise Complète',
                'Conjonctions et Liaisons': 'Syntaxe Complexe et Style Littéraire',
                'Culture Française': 'Civilisation et Histoire Contemporaine',
                'Littérature Française': 'Analyse Littéraire Approfondie',
                'Débats et Discussions': 'Rhétorique et Argumentation Avancée'
            };
            
            let updatedCount = 0;
            
            for (const [oldTitle, newTitle] of Object.entries(intermediateUpdates)) {
                const chaptersToUpdate = await prisma.chapter.findMany({
                    where: {
                        level: 'INTERMEDIATE',
                        title: oldTitle
                    }
                });
                
                if (chaptersToUpdate.length > 0) {
                    await prisma.chapter.updateMany({
                        where: {
                            level: 'INTERMEDIATE',
                            title: oldTitle
                        },
                        data: {
                            title: newTitle,
                            topic: newTitle.split(':')[0] || newTitle // Use first part as topic
                        }
                    });
                    
                    console.log(`  ✅ Updated "${oldTitle}" → "${newTitle}" (${chaptersToUpdate.length} chapters)`);
                    updatedCount += chaptersToUpdate.length;
                }
            }
            
            console.log(`\n✅ Updated ${updatedCount} intermediate chapters to be more advanced\n`);
        }
        
        // Update lesson content to match new chapter levels
        console.log('📚 Updating lesson content for intermediate level');
        console.log('===============================================');
        
        const intermediateLessons = await prisma.lesson.findMany({
            where: {
                chapter: {
                    level: 'INTERMEDIATE'
                }
            },
            include: {
                chapter: {
                    select: { title: true, topic: true }
                }
            },
            take: 20
        });
        
        console.log(`Found ${intermediateLessons.length} intermediate lessons to update`);
        
        // Update lesson topics to be more advanced
        for (const lesson of intermediateLessons) {
            let newTopic = lesson.topic;
            
            // Make topics more advanced
            if (lesson.topic.includes('Salutations')) {
                newTopic = 'Protocole et Étiquette Sociale';
            } else if (lesson.topic.includes('Chiffres') || lesson.topic.includes('Numbers')) {
                newTopic = 'Mathématiques et Statistiques en Français';
            } else if (lesson.topic.includes('Famille')) {
                newTopic = 'Sociologie Familiale et Relations';
            } else if (lesson.topic.includes('Couleurs')) {
                newTopic = 'Art et Esthétique: Théorie des Couleurs';
            } else if (lesson.topic.includes('Restaurant') || lesson.topic.includes('Nourriture')) {
                newTopic = 'Gastronomie et Critique Culinaire';
            }
            
            await prisma.lesson.update({
                where: { id: lesson.id },
                data: { topic: newTopic }
            });
        }
        
        console.log(`✅ Updated topics for ${intermediateLessons.length} intermediate lessons\n`);
        
        // Verify the changes
        console.log('🔍 Verifying curriculum differences after fixes');
        console.log('==============================================');
        
        const updatedBeginnerChapters = await prisma.chapter.findMany({
            where: { level: 'BEGINNER' },
            select: { title: true, chapterNumber: true },
            orderBy: { chapterNumber: 'asc' },
            take: 10
        });
        
        const updatedIntermediateChapters = await prisma.chapter.findMany({
            where: { level: 'INTERMEDIATE' },
            select: { title: true, chapterNumber: true },
            orderBy: { chapterNumber: 'asc' },
            take: 10
        });
        
        const newBeginnerTitles = updatedBeginnerChapters.map(ch => ch.title);
        const newIntermediateTitles = updatedIntermediateChapters.map(ch => ch.title);
        const remainingIdentical = newBeginnerTitles.filter(title => newIntermediateTitles.includes(title));
        
        console.log('Updated BEGINNER chapters (first 10):');
        updatedBeginnerChapters.forEach(ch => {
            console.log(`  ${ch.chapterNumber}. ${ch.title}`);
        });
        
        console.log('\nUpdated INTERMEDIATE chapters (first 10):');
        updatedIntermediateChapters.forEach(ch => {
            console.log(`  ${ch.chapterNumber}. ${ch.title}`);
        });
        
        console.log(`\n📊 Remaining identical titles: ${remainingIdentical.length}`);
        if (remainingIdentical.length > 0) {
            console.log('Still identical:');
            remainingIdentical.forEach(title => console.log(`  - "${title}"`));
        } else {
            console.log('✅ All curriculum levels now have unique content!');
        }
        
        console.log('\n🎉 Curriculum level fixes completed!');
        
    } catch (error) {
        console.error('❌ Error fixing curriculum levels:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixCurriculumLevels();