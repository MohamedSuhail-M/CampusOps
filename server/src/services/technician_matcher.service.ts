import prisma from '../prisma';

export interface TechnicianCandidate {
  userId: string;
  name: string;
  loginId: string;
  skillId: string;
  skillName: string;
  skillLevel: number;
  isEligible: boolean;
  status: 'AVAILABLE' | 'ON_LEAVE' | 'NO_SHIFT' | 'WORKLOAD_BUSY';
  reason: string;
  activeWorkload: number;
}

export async function findEligibleTechnicians(
  requiredSkillId: string,
  targetDate: Date = new Date()
): Promise<{ eligible: TechnicianCandidate[]; excluded: TechnicianCandidate[] }> {
  // 1. Fetch all technicians with the required skill
  const techniciansWithSkill = await prisma.technicianSkill.findMany({
    where: { skillId: requiredSkillId },
    include: {
      user: {
        include: {
          shifts: true,
          leaves: true,
          assignedWorkOrders: {
            where: { status: { in: ['ASSIGNED', 'IN_PROGRESS', 'BLOCKED'] } },
          },
        },
      },
      skill: true,
    },
  });

  const candidates: TechnicianCandidate[] = [];

  for (const record of techniciansWithSkill) {
    const user = record.user;
    const targetTimestamp = targetDate.getTime();

    // 2. Check approved leave: If on approved leave covering targetDate -> EXCLUDE
    const onApprovedLeave = user.leaves.find(
      (lv) =>
        lv.status === 'APPROVED' &&
        new Date(lv.startsAt).getTime() <= targetTimestamp &&
        new Date(lv.endsAt).getTime() >= targetTimestamp
    );

    if (onApprovedLeave) {
      candidates.push({
        userId: user.id,
        name: user.name,
        loginId: user.loginId,
        skillId: record.skillId,
        skillName: record.skill.name,
        skillLevel: record.level,
        isEligible: false,
        status: 'ON_LEAVE',
        reason: `Excluded: On approved leave from ${new Date(onApprovedLeave.startsAt).toLocaleDateString()} to ${new Date(onApprovedLeave.endsAt).toLocaleDateString()}`,
        activeWorkload: user.assignedWorkOrders.length,
      });
      continue;
    }

    // 3. Check shift availability
    const hasShift = user.shifts.some(
      (sh) =>
        new Date(sh.startsAt).getTime() <= targetTimestamp &&
        new Date(sh.endsAt).getTime() >= targetTimestamp
    );

    // In local demo dataset, if technician has a shift today or general active shift
    const workload = user.assignedWorkOrders.length;

    candidates.push({
      userId: user.id,
      name: user.name,
      loginId: user.loginId,
      skillId: record.skillId,
      skillName: record.skill.name,
      skillLevel: record.level,
      isEligible: true,
      status: 'AVAILABLE',
      reason: hasShift
        ? 'Available on active scheduled shift'
        : 'Available in department roster',
      activeWorkload: workload,
    });
  }

  // Rank eligible candidates: higher skill level first, lower workload first
  const eligible = candidates
    .filter((c) => c.isEligible)
    .sort((a, b) => {
      if (b.skillLevel !== a.skillLevel) return b.skillLevel - a.skillLevel;
      return a.activeWorkload - b.activeWorkload;
    });

  const excluded = candidates.filter((c) => !c.isEligible);

  return { eligible, excluded };
}
