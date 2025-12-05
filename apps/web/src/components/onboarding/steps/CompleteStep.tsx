'use client';

import { motion } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import { CheckCircle2, Home, PartyPopper, Calendar, CreditCard, Bell } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

import { Button, cn } from '@jwc/ui';
import { useOnboardingFormStore } from '@/store/onboarding-form-store';

const formVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

const nextSteps = [
  {
    icon: CreditCard,
    title: '참가비 입금',
    description: '안내된 계좌로 참가비를 입금해주세요',
  },
  {
    icon: Bell,
    title: '입금 확인',
    description: '입금 확인 후 최종 신청이 완료됩니다',
  },
  {
    icon: Calendar,
    title: '수련회 참가',
    description: '세부 일정은 추후 공지해드리겠습니다',
  },
];

export function CompleteStep() {
  const navigate = useNavigate();
  const { personalInfo, clearForm } = useOnboardingFormStore();
  const { width, height } = useWindowSize();

  const handleGoHome = () => {
    clearForm();
    navigate({ to: '/' });
  };

  return (
    <>
      <Confetti
        gravity={0.2}
        height={height}
        numberOfPieces={150}
        recycle={false}
        width={width}
        colors={['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B']}
      />

      <div className="w-full max-w-xl mx-auto px-4 py-12">
        <motion.div
          variants={formVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center"
        >
          {/* 성공 아이콘 */}
          <motion.div variants={itemVariants} className="relative mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="relative"
            >
              <div className="flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/30">
                <CheckCircle2 className="w-14 h-14 text-white" />
              </div>
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                className="absolute -top-3 -right-3"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
                  <PartyPopper className="w-6 h-6 text-white" />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* 타이틀 */}
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              신청 완료! 🎉
            </h1>
            <p className="text-lg text-muted-foreground">
              <span className="text-primary font-medium">{personalInfo.name || '신청자'}</span>님의 수련회 신청이 접수되었습니다
            </p>
          </motion.div>

          {/* 다음 단계 카드 */}
          <motion.div
            variants={itemVariants}
            className="w-full rounded-2xl border border-border/50 bg-muted/20 overflow-hidden mb-8"
          >
            <div className="px-6 py-4 border-b border-border/30 bg-muted/30">
              <h3 className="font-semibold text-foreground">다음 단계</h3>
            </div>
            <div className="p-4 space-y-4">
              {nextSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-start gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-xl shrink-0',
                    index === 0 ? 'bg-primary/10 text-primary' :
                    index === 1 ? 'bg-amber-500/10 text-amber-500' :
                    'bg-green-500/10 text-green-500'
                  )}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">{step.title}</div>
                    <div className="text-sm text-muted-foreground">{step.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 안내 메시지 */}
          <motion.div
            variants={itemVariants}
            className="w-full p-4 rounded-xl bg-primary/5 border border-primary/20 mb-8"
          >
            <p className="text-sm text-muted-foreground">
              입금 확인 및 세부 안내는 등록하신 연락처로 문자 또는 카카오톡으로 안내드리겠습니다.
            </p>
          </motion.div>

          {/* 홈 버튼 */}
          <motion.div variants={itemVariants}>
            <Button
              onClick={handleGoHome}
              className={cn(
                'h-12 px-8 rounded-xl font-medium shadow-lg transition-all duration-200',
                'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70',
                'text-primary-foreground shadow-primary/20'
              )}
            >
              <Home className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}

export default CompleteStep;
