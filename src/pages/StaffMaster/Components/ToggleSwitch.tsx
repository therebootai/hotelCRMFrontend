interface ToggleSwitchProps {
 isActive: boolean;
 onToggle: () => void;
}

const ToggleSwitch = ({ isActive, onToggle }: ToggleSwitchProps) => (
 <div
 onClick={onToggle}
 className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
 isActive ? "bg-primary" : "bg-gray-300"
 }`}
 >
 <div
 className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
 isActive ? "translate-x-4" : "translate-x-0"
 }`}
 />
 </div>
);

export default ToggleSwitch;
