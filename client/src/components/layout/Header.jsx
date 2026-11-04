import React from 'react'
import { useApp } from '../../context/AppContext'
import { ArrowUpDownIcon, LogOutIcon, MenuIcon, SearchIcon, UserIcon } from 'lucide-react'
import { Dropdown, DropdownItem } from '../ui/Dropdown'
import { SORT_OPTIONS } from '../../assets/assets'

const Header = ({onMobileMenuToggle}) => {

  const {user, logout, searchQuery, setSearchQuery, sortBy, setSortBy} = useApp()

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b
    border-slate-200 px-3 sm:px-4 md:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Menu Toggle & Search Bar */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl min-w-0">
           <button 
             type="button" 
             onClick={onMobileMenuToggle} 
             className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 md:hidden shrink-0 transition"
             aria-label="Open sidebar menu"
           >
               <MenuIcon className="size-5"/>
           </button>

           <div className="relative flex-1 min-w-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <SearchIcon className="size-4"/>
              </div>
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e)=>setSearchQuery(e.target.value)} 
                placeholder="Search..." 
                className="w-full bg-slate-100 border border-slate-200 focus:bg-white focus:border-orange-600
                focus:ring-1 focus:ring-orange-600 rounded-xl text-xs sm:text-sm text-slate-900
                placeholder-slate-400 pl-9 sm:pl-10 pr-12 sm:pr-14 py-2 transition outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={()=> setSearchQuery("")} 
                  className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center text-xs text-slate-500
                  hover:text-slate-900 font-medium"
                >
                   Clear
                </button>
              )}
           </div>
        </div>

        {/* Right: Sort and User Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Dropdown 
              align="right"
              className="w-44 sm:w-48"
              trigger={
                <button 
                  type="button" 
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2
                  bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                  aria-label="Sort options"
                >
                    <ArrowUpDownIcon className="w-3.5 h-3.5 text-slate-500"/>
                    <span className="hidden sm:inline">Sort</span>
                </button>
            }>
                 {SORT_OPTIONS.map((opt)=>(
                    <DropdownItem key={opt.value} onClick={()=> setSortBy(opt.value)}>
                        <span className={sortBy === opt.value ? "text-orange-600 font-semibold" : ""}>
                            {opt.label}
                        </span>
                    </DropdownItem>
                 ))}
            </Dropdown>

            {/* User Avatar Menu */}
            <Dropdown 
              align="right"
              className="w-56"
              trigger={
                <button 
                  type="button" 
                  className="size-8 sm:size-9 rounded-full bg-orange-600 text-white font-semibold text-xs sm:text-sm 
                  flex items-center justify-center border border-orange-700 hover:bg-orange-700 transition"
                  aria-label="User profile"
                >
                    {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="size-4"/>}
                </button>
            }>
                <div className="px-4 py-3 border-b border-slate-200">
                    <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>

                <DropdownItem icon={LogOutIcon} danger onClick={logout}>
                   Log Out
                </DropdownItem>
            </Dropdown>
        </div>
    </header>
  )
}

export default Header
