import { type GunData } from '../objects/Tank';

interface GunInventoryProps {
  guns: GunData[];
  selectedGunIndex: number;
}

const GunInventory = ({ guns, selectedGunIndex }: GunInventoryProps) => {
  const maxSlots = 3;
  const slots = Array.from({ length: maxSlots }, (_, i) => guns[i] || null);

  const getGunLabel = (gun: GunData | null): string => {
    if (!gun) return '';
    
    const gunTypeName = gun.gunType.tag;
    const ammoText = gun.ammo !== null && gun.ammo !== undefined ? ` (${gun.ammo})` : '';
    return gunTypeName + ammoText;
  };

  const getGunColor = (gun: GunData): string => {
    switch (gun.gunType.tag) {
      case 'Base':
        return '#888888';
      case 'TripleShooter':
        return '#ff9900';
      case 'MissileLauncher':
        return '#ff0000';
      default:
        return '#888888';
    }
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '8px',
      padding: '12px',
      background: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '8px',
      border: '2px solid #444',
      zIndex: 100,
      fontFamily: 'monospace'
    }}>
      {slots.map((gun, index) => (
        <div
          key={index}
          style={{
            width: '80px',
            height: '80px',
            border: selectedGunIndex === index && gun ? '3px solid #ffff00' : '2px solid #666',
            borderRadius: '4px',
            background: gun ? getGunColor(gun) : '#333',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: selectedGunIndex === index && gun ? '0 0 10px #ffff00' : 'none',
            opacity: gun ? 1 : 0.3
          }}
        >
          {gun && (
            <>
              <div style={{
                fontSize: '10px',
                color: '#fff',
                textAlign: 'center',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px #000',
                padding: '4px',
                wordWrap: 'break-word',
                width: '100%'
              }}>
                {getGunLabel(gun)}
              </div>
              <div style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                fontSize: '12px',
                color: '#fff',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px #000'
              }}>
                {index + 1}
              </div>
            </>
          )}
          {!gun && (
            <div style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              fontSize: '12px',
              color: '#666',
              fontWeight: 'bold'
            }}>
              {index + 1}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default GunInventory;
