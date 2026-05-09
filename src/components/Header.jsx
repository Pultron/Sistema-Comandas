import { SearchIcon, BellIcon, UserIcon } from './Icons'
import { appStyles } from '../styles/styles'

export const Header = () => {
  return (
    <header style={appStyles.topHeader}>
      <div style={appStyles.searchBar}>
        <input type="text" placeholder="Buscar..." style={appStyles.searchInput} />
        <button style={{...appStyles.iconBtn, padding: '0 1rem'}}>
          <SearchIcon size={18} color="white" />
        </button>
      </div>
      <div style={appStyles.headerIcons}>
        <button style={appStyles.iconBtn}>
          <BellIcon size={20} color="white" />
        </button>
        <button style={appStyles.iconBtn}>
          <UserIcon size={20} color="white" />
        </button>
      </div>
    </header>
  )
}





