// ============================================================================
// Interactive Tutorial Component
// ============================================================================

import { memo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  highlight?: string; // Element to highlight (e.g., 'bet-panel', 'deal-button')
  action?: () => void; // Optional action to perform
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 0,
    title: 'Bienvenue au Blackjack !',
    description: 'Apprenez à jouer au blackjack en quelques étapes simples. Ce tutoriel vous guidera à travers toutes les fonctionnalités du jeu.',
  },
  {
    id: 1,
    title: 'Placer une mise',
    description: 'Commencez par placer une mise en utilisant les jetons ou le slider. La mise minimum est affichée. Cliquez sur les jetons pour ajouter à votre mise.',
    highlight: 'bet-panel',
  },
  {
    id: 2,
    title: 'Distribuer les cartes',
    description: 'Une fois votre mise placée, cliquez sur le bouton "Deal" pour distribuer les cartes. Vous recevrez 2 cartes et le dealer en recevra 2 (une face cachée).',
    highlight: 'deal-button',
  },
  {
    id: 3,
    title: 'Actions disponibles',
    description: 'Pendant votre tour, vous pouvez :\n• Hit : Tirer une carte supplémentaire\n• Stand : Rester avec votre main actuelle\n• Double : Doubler votre mise et tirer une seule carte\n• Split : Séparer une paire en deux mains',
    highlight: 'controls',
  },
  {
    id: 4,
    title: 'Comprendre les résultats',
    description: '• Blackjack (21 avec 2 cartes) : Vous gagnez 3:2 de votre mise\n• Victoire : Vous gagnez votre mise\n• Défaite : Vous perdez votre mise\n• Push : Égalité, votre mise est rendue',
  },
  {
    id: 5,
    title: 'Stratégie de base',
    description: 'Conseils de stratégie :\n• Toujours split les As et les 8\n• Double sur 11 si le dealer montre 2-10\n• Stand sur 17 ou plus\n• Hit sur 11 ou moins',
  },
  {
    id: 6,
    title: 'Prêt à jouer !',
    description: 'Vous êtes maintenant prêt à jouer ! N\'oubliez pas que vous pouvez toujours consulter les statistiques et l\'historique de vos mains.',
  },
];

export const Tutorial = memo(function Tutorial() {
  const tutorialCompleted = useGameStore(s => s.tutorialCompleted);
  const tutorialStep = useGameStore(s => s.tutorialStep);
  const setTutorialStep = useGameStore(s => s.setTutorialStep);
  const completeTutorial = useGameStore(s => s.completeTutorial);
  const [isOpen, setIsOpen] = useState(!tutorialCompleted);
  
  const currentStep = TUTORIAL_STEPS[tutorialStep] || TUTORIAL_STEPS[0];
  const progress = ((tutorialStep + 1) / TUTORIAL_STEPS.length) * 100;
  
  const handleNext = useCallback(() => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      completeTutorial();
      setIsOpen(false);
    }
  }, [tutorialStep, setTutorialStep, completeTutorial]);
  
  const handlePrevious = useCallback(() => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);
    }
  }, [tutorialStep, setTutorialStep]);
  
  const handleSkip = useCallback(() => {
    completeTutorial();
    setIsOpen(false);
  }, [completeTutorial]);
  
  if (!isOpen && tutorialCompleted) {
    return null;
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={(e) => {
              // Only skip if clicking directly on overlay, not on card
              if (e.target === e.currentTarget) {
                handleSkip();
              }
            }}
          />
          
          {/* Tutorial Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <Card 
              className="max-w-2xl w-full pointer-events-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{currentStep.title}</CardTitle>
                    <CardDescription className="mt-2">
                      Étape {tutorialStep + 1} sur {TUTORIAL_STEPS.length}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('[Tutorial] Close clicked');
                      handleSkip();
                    }}
                    className="h-8 w-8"
                    aria-label="Fermer le tutoriel"
                    type="button"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Progress value={progress} className="mt-4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-base whitespace-pre-line leading-relaxed">
                  {currentStep.description}
                </div>
                
                <div className="flex justify-between items-center pt-4">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('[Tutorial] Previous clicked', { tutorialStep });
                      handlePrevious();
                    }}
                    disabled={tutorialStep === 0}
                    type="button"
                    style={{ pointerEvents: tutorialStep === 0 ? 'none' : 'auto' }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Précédent
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[Tutorial] Skip clicked');
                        handleSkip();
                      }}
                      type="button"
                      style={{ pointerEvents: 'auto' }}
                    >
                      Passer
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[Tutorial] Next clicked', { tutorialStep, isLast: tutorialStep === TUTORIAL_STEPS.length - 1 });
                        handleNext();
                      }}
                      className="min-w-[120px]"
                      type="button"
                      style={{ pointerEvents: 'auto' }}
                    >
                      {tutorialStep === TUTORIAL_STEPS.length - 1 ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Terminer
                        </>
                      ) : (
                        <>
                          Suivant
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
