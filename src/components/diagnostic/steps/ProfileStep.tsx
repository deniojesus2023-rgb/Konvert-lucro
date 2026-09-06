import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import {
  DELIVERY_TYPE_OPTIONS,
  MAIN_CHANNEL_OPTIONS,
  type ProfileAnswers,
} from "../wizard-types";

interface ProfileStepProps {
  profile: ProfileAnswers;
  onChange: (profile: ProfileAnswers) => void;
}

export function ProfileStep({ profile, onChange }: ProfileStepProps) {
  return (
    <div className="flex flex-col gap-8">
      <ChoiceGroup
        name="deliveryType"
        label="Qual é o tipo do seu delivery?"
        options={DELIVERY_TYPE_OPTIONS}
        value={profile.deliveryType}
        onChange={(deliveryType) => onChange({ ...profile, deliveryType })}
      />
      <ChoiceGroup
        name="mainChannel"
        label="Por onde entram mais pedidos?"
        options={MAIN_CHANNEL_OPTIONS}
        value={profile.mainChannel}
        onChange={(mainChannel) => onChange({ ...profile, mainChannel })}
      />
    </div>
  );
}

export const PROFILE_STEP_META = {
  title: "Vamos começar pelo seu delivery.",
};
